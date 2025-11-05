'use server';

import { revalidatePath } from 'next/cache';
import { backendService } from './services';
import { aiService, type CreateChapterRequest, type GenerateSubchapterRequest } from './ai-service';
import { aiServiceClient, type TransformRequest } from './ai-service-client';
import type { Course, Chapter } from './definitions';
// Importar funções helper (opcional - podem ser usadas para simplificar código)
import { prepareIntroductionPayload, prepareSubchapterPayload } from './utils/ai-service';

/**
 * Converte um valor para número, garantindo que seja um número válido
 * Aceita string, number, ou qualquer valor conversível
 * Trata null, undefined, strings vazias, etc.
 */
function toNumber(value: any, fallback: number): number {
  // Se já é um número válido, retorna
  if (typeof value === 'number' && !isNaN(value) && isFinite(value) && value > 0) {
    return Math.floor(value); // Garante que é inteiro
  }

  // Se é null ou undefined, retorna fallback
  if (value == null) {
    return fallback;
  }

  // Se é string, tenta converter
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return fallback;
    }
    const parsed = parseInt(trimmed, 10);
    if (!isNaN(parsed) && isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  // Se é boolean, converte (1 ou 0, mas 0 não é válido, então retorna fallback)
  if (typeof value === 'boolean') {
    return fallback;
  }

  // Para qualquer outro tipo, retorna fallback
  return fallback;
}

/**
 * Normaliza um ChapterOutline garantindo que todos os campos numéricos sejam números
 */
function normalizeChapterOutline(outline: any, index: number) {
  // Log para debug se valores forem problemáticos
  if (outline.number == null || outline.number === '' || isNaN(Number(outline.number))) {
    console.warn(`⚠️ outline[${index}].number problemático:`, {
      value: outline.number,
      type: typeof outline.number,
      isNull: outline.number === null,
      isUndefined: outline.number === undefined,
    });
  }

  const number = toNumber(outline.number, index + 1);
  const wordCount = toNumber(outline.wordCount, 1000);
  const order = toNumber(outline.order, number);

  // Validação final: se ainda assim resultou em NaN ou inválido, lança erro
  if (isNaN(number) || number < 1) {
    throw new Error(
      `Não foi possível normalizar outline[${index}].number. Valor original: ${outline.number}, Tipo: ${typeof outline.number}`
    );
  }

  if (isNaN(wordCount) || wordCount < 1) {
    throw new Error(
      `Não foi possível normalizar outline[${index}].wordCount. Valor original: ${outline.wordCount}, Tipo: ${typeof outline.wordCount}`
    );
  }

  if (isNaN(order) || order < 1) {
    throw new Error(
      `Não foi possível normalizar outline[${index}].order. Valor original: ${outline.order}, Tipo: ${typeof outline.order}`
    );
  }

  return {
    number,
    title: String(outline.title || '').trim(),
    description: String(outline.description || '').trim(),
    wordCount,
    order,
  };
}

export async function createCourseAction(
  values: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'chapters'>
) {
  try {
    // 1. Cria o curso no backend (sem conteúdo ainda)
    const { data: newCourse } = await backendService.createCourse(values);

    if (!newCourse || !newCourse.id) {
      throw new Error('Falha ao criar curso no backend. ID não retornado.');
    }

    console.log('Curso criado no backend:', newCourse.id);
    console.log('Iniciando geração da introdução completa via AI Service...');

    // 2. Monta requisição COMPLETA para o AI Service gerar a introdução
    // TODOS os dados são enviados para o AI Service gerar o conteúdo

    // Prepara chapterOutlines com validação e garantia de tipos
    if (!newCourse.chapterOutlines || newCourse.chapterOutlines.length === 0) {
      throw new Error('É necessário ter pelo menos um capítulo na ementa para gerar a introdução.');
    }

    // Log dos dados recebidos do backend para debug
    console.log('📥 Dados recebidos do backend:');
    console.log('chapterOutlines raw:', JSON.stringify(newCourse.chapterOutlines, null, 2));
    console.log('chapterOutlines[0].number:', newCourse.chapterOutlines[0]?.number, 'type:', typeof newCourse.chapterOutlines[0]?.number);
    console.log('chapterOutlines[0].wordCount:', newCourse.chapterOutlines[0]?.wordCount, 'type:', typeof newCourse.chapterOutlines[0]?.wordCount);
    console.log('chapterOutlines[0].order:', newCourse.chapterOutlines[0]?.order, 'type:', typeof newCourse.chapterOutlines[0]?.order);

    // ⚠️ NORMALIZAÇÃO DEFENSIVA: Garante que number e order sempre existam
    // Mesmo que o Backend retorne sem esses campos, garantimos que estarão presentes
    const defensiveNormalizedOutlines = newCourse.chapterOutlines
      .filter(outline => outline && outline.title) // Remove apenas inválidos absolutos (mantém mesmo se number estiver undefined)
      .map((outline, index) => {
        // Se number está undefined/null, usa índice + 1 como fallback
        const number = outline.number != null && outline.number !== undefined
          ? toNumber(outline.number, index + 1)
          : index + 1;

        // Se order está undefined/null, usa number como fallback
        const order = outline.order != null && outline.order !== undefined
          ? toNumber(outline.order, number)
          : number;

        return {
          number,
          title: String(outline.title || '').trim(),
          description: String(outline.description || '').trim(),
          wordCount: toNumber(outline.wordCount, 1000),
          order,
        };
      })
      .filter(outline => outline.title.length >= 3 && outline.description.length >= 50); // Valida mínimos

    // 1. Filtra inválidos e normaliza tipos (agora com dados já garantidos)
    const normalizedOutlines = defensiveNormalizedOutlines
      .map((outline, index) => normalizeChapterOutline(outline, index))
      .filter(outline => outline.title.length >= 3 && outline.description.length >= 50); // Valida mínimos (50 caracteres para descrição)

    if (normalizedOutlines.length === 0) {
      throw new Error('É necessário ter pelo menos um capítulo válido na ementa para gerar a introdução.');
    }

    // 2. Ordena por número e remove duplicatas
    const sortedOutlines = normalizedOutlines
      .sort((a, b) => a.number - b.number)
      // Remove duplicatas mantendo o primeiro de cada número
      .filter((outline, index, self) =>
        index === self.findIndex(o => o.number === outline.number)
      );

    // 3. Reordena os números sequencialmente para garantir unicidade absoluta
    const reorderedOutlines = sortedOutlines.map((outline, index) => ({
      number: index + 1, // Garante números sequenciais únicos (1, 2, 3, ...)
      title: outline.title,
      description: outline.description,
      wordCount: outline.wordCount,
      order: index + 1, // Garante order sequencial (1, 2, 3, ...)
    }));

    // 4. Validação final: garante que não há números duplicados (deve ser impossível após reordenação)
    const chapterNumbers = reorderedOutlines.map(o => o.number);
    const uniqueNumbers = new Set(chapterNumbers);
    if (chapterNumbers.length !== uniqueNumbers.size) {
      const duplicates = chapterNumbers.filter(
        (num, index) => chapterNumbers.indexOf(num) !== index
      );
      throw new Error(
        `Números de capítulos duplicados detectados após normalização. Duplicados: ${[...new Set(duplicates)].join(', ')}`
      );
    }

    // 5. Garante que chapterOutlines está no formato correto (somente propriedades esperadas)
    // E garante que todos os valores numéricos são realmente números (não strings)
    // IMPORTANTE: reorderedOutlines já tem números válidos, então apenas garantimos que são números primitivos
    const formattedChapterOutlines = reorderedOutlines.map((outline, index) => {
      // Como já normalizamos antes, esses valores devem ser números válidos
      // Mas garantimos uma última vez para evitar NaN
      const number = typeof outline.number === 'number' && !isNaN(outline.number) && outline.number > 0
        ? Math.floor(outline.number)
        : index + 1;

      const wordCount = typeof outline.wordCount === 'number' && !isNaN(outline.wordCount) && outline.wordCount > 0
        ? Math.floor(outline.wordCount)
        : 1000;

      const order = typeof outline.order === 'number' && !isNaN(outline.order) && outline.order > 0
        ? Math.floor(outline.order)
        : number;

      // Validação final antes de retornar
      if (isNaN(number) || number < 1) {
        throw new Error(`Erro crítico: number inválido após todas as normalizações. Index: ${index}, outline: ${JSON.stringify(outline)}`);
      }
      if (isNaN(wordCount) || wordCount < 1) {
        throw new Error(`Erro crítico: wordCount inválido após todas as normalizações. Index: ${index}, outline: ${JSON.stringify(outline)}`);
      }
      if (isNaN(order) || order < 1) {
        throw new Error(`Erro crítico: order inválido após todas as normalizações. Index: ${index}, outline: ${JSON.stringify(outline)}`);
      }

      return {
        number,
        title: String(outline.title || '').trim(),
        description: String(outline.description || '').trim(),
        wordCount,
        order,
      };
    });

    // Validação final: garante que formattedChapterOutlines tem todos os campos necessários
    const validatedChapterOutlines = formattedChapterOutlines.map((outline, index) => {
      // Garante que todos os campos obrigatórios estão presentes e são válidos
      if (!outline.number || isNaN(outline.number) || outline.number < 1) {
        throw new Error(`chapterOutlines[${index}].number inválido: ${outline.number}`);
      }
      if (!outline.title || typeof outline.title !== 'string' || outline.title.trim().length < 3) {
        throw new Error(`chapterOutlines[${index}].title inválido: deve ter pelo menos 3 caracteres`);
      }
      if (!outline.description || typeof outline.description !== 'string' || outline.description.trim().length < 50) {
        throw new Error(`chapterOutlines[${index}].description inválido: deve ter pelo menos 50 caracteres. Atual: ${outline.description.trim().length} caracteres`);
      }
      if (!outline.wordCount || isNaN(outline.wordCount) || outline.wordCount < 100) {
        throw new Error(`chapterOutlines[${index}].wordCount inválido: ${outline.wordCount}`);
      }
      if (!outline.order || isNaN(outline.order) || outline.order < 1) {
        throw new Error(`chapterOutlines[${index}].order inválido: ${outline.order}`);
      }

      // Retorna apenas os campos necessários, sem campos extras
      return {
        number: outline.number,
        title: outline.title,
        description: outline.description,
        wordCount: outline.wordCount,
        order: outline.order,
      };
    });

    // Validações explícitas antes de enviar (conforme guia)
    if (!newCourse.title || newCourse.title.trim().length < 3) {
      throw new Error('courseTitle deve ter pelo menos 3 caracteres');
    }
    if (!newCourse.template || newCourse.template.trim().length < 10) {
      throw new Error('template deve ter pelo menos 10 caracteres');
    }
    if (!newCourse.philosophy || newCourse.philosophy.trim().length < 10) {
      throw new Error('philosophy deve ter pelo menos 10 caracteres');
    }
    if (!newCourse.subchapterTemplate?.structure || newCourse.subchapterTemplate.structure.trim().length < 20) {
      throw new Error('subchapterTemplate.structure deve ter pelo menos 20 caracteres');
    }

    // NOTA: Alternativamente, você pode usar a função helper:
    // const chapterInput = prepareIntroductionPayload(newCourse);
    // Isso simplifica o código e garante todas as validações conforme o guia.
    // O código atual é mais explícito e oferece mais controle sobre o processo.

    const chapterInput: CreateChapterRequest = {
      courseId: newCourse.id,
      courseTitle: newCourse.title,
      courseDescription: newCourse.description || '',
      // ✅ CORRETO: Quando isIntroduction=true, envia chapterOutlines (array)
      chapterOutlines: validatedChapterOutlines,
      subject: newCourse.subject,
      educationalLevel: newCourse.educationalLevel || 'Ensino Médio',
      targetAudience: newCourse.targetAudience || 'Estudantes',
      template: newCourse.template,
      // Template de subcapítulos para contexto
      subchapterTemplate: newCourse.subchapterTemplate ? {
        structure: newCourse.subchapterTemplate.structure,
        minSubchapters: newCourse.subchapterTemplate.minSubchapters,
        maxSubchapters: newCourse.subchapterTemplate.maxSubchapters,
        wordCountPerSubchapter: newCourse.subchapterTemplate.wordCountPerSubchapter
      } : undefined,
      philosophy: newCourse.philosophy,
      // Bibliografia para contexto da IA
      bibliography: newCourse.bibliography?.map(bib => ({
        title: bib.title,
        author: bib.author,
        year: bib.year,
        url: bib.url
      })),
      // Dados específicos para a introdução
      title: 'Introdução',
      prompt: `Gere uma introdução completa, detalhada e profissional para o curso "${newCourse.title}". 
      
A introdução deve incluir:
1. Visão geral do curso e sua importância
2. Objetivos de aprendizagem principais
3. Estrutura do curso (mencionar os ${newCourse.chapterOutlines?.length || 0} capítulos planejados)
4. Metodologia de ensino e abordagem pedagógica
5. Público-alvo e pré-requisitos (se houver)
6. Benefícios esperados para os estudantes

Use a filosofia educacional: "${newCourse.philosophy}"
Considere o nível educacional: ${newCourse.educationalLevel || 'Ensino Médio'}
Público-alvo: ${newCourse.targetAudience || 'Estudantes'}

${newCourse.bibliography && newCourse.bibliography.length > 0
          ? `Referências bibliográficas disponíveis: ${newCourse.bibliography.map(b => b.title).join(', ')}`
          : ''}

A introdução deve ser completa, envolvente e fornecer uma base sólida para o restante do curso.`,
      chapterNumber: 0, // ✅ CORRETO: Para introdução, deve ser 0
      isIntroduction: true, // Flag importante: indica que é a introdução completa
      additionalContext: `IMPORTANTE: Este é o capítulo introdutório COMPLETO do curso. 
      
O AI Service deve gerar TODO o conteúdo da introdução, incluindo:
- Texto completo e bem estruturado
- Seções organizadas (pode usar subtítulos)
- Conteúdo rico e informativo
- Formatação adequada em HTML

NÃO criar apenas uma estrutura vazia. O conteúdo deve ser gerado completamente pela IA.
      
Curso: ${newCourse.title}
Disciplina: ${newCourse.subject}
Ementa geral: ${newCourse.description}
`
    };

    // 3. Chama o AI Service para gerar TODO o conteúdo da introdução
    // O AI Service irá:
    // - Gerar o conteúdo completo usando IA
    // - Estruturar o conteúdo em HTML
    // - Salvar automaticamente no backend
    console.log('Enviando requisição para AI Service gerar introdução...');
    console.log('isIntroduction:', chapterInput.isIntroduction);
    console.log('chapterOutlines count:', formattedChapterOutlines.length);
    console.log('chapterOutlines numbers:', formattedChapterOutlines.map(o => o.number));
    console.log('chapterOutlines numbers types:', formattedChapterOutlines.map(o => typeof o.number));
    console.log('chapterOutlines orders:', formattedChapterOutlines.map(o => o.order));
    console.log('chapterOutlines orders types:', formattedChapterOutlines.map(o => typeof o.order));

    // Validação de tipos antes de enviar
    const invalidTypes = formattedChapterOutlines.filter(o =>
      typeof o.number !== 'number' ||
      typeof o.wordCount !== 'number' ||
      typeof o.order !== 'number' ||
      isNaN(o.number) ||
      isNaN(o.wordCount) ||
      isNaN(o.order)
    );

    if (invalidTypes.length > 0) {
      console.error('❌ ERRO: Tipos inválidos detectados:', invalidTypes);
      throw new Error('Tipos inválidos nos chapterOutlines. Todos os campos numéricos devem ser números.');
    }

    // Log final do payload real que será enviado (sem campos extras)
    console.log('📤 Payload final que será enviado:');
    console.log('chapterNumber:', chapterInput.chapterNumber);
    console.log('isIntroduction:', chapterInput.isIntroduction);
    console.log('chapterOutlines count:', validatedChapterOutlines.length);
    console.log('chapterOutlines[0]:', JSON.stringify(validatedChapterOutlines[0], null, 2));

    // Validação final do payload completo antes de enviar
    // Remove campos undefined para evitar enviar dados desnecessários
    const payloadToSend: CreateChapterRequest = {
      courseId: chapterInput.courseId,
      courseTitle: chapterInput.courseTitle,
      courseDescription: chapterInput.courseDescription || '',
      subject: chapterInput.subject,
      educationalLevel: chapterInput.educationalLevel,
      targetAudience: chapterInput.targetAudience,
      template: chapterInput.template,
      philosophy: chapterInput.philosophy,
      isIntroduction: chapterInput.isIntroduction,
      chapterNumber: chapterInput.chapterNumber,
      chapterOutlines: validatedChapterOutlines, // ✅ Array quando isIntroduction=true
      subchapterTemplate: chapterInput.subchapterTemplate,
      bibliography: chapterInput.bibliography?.length ? chapterInput.bibliography : undefined,
      title: chapterInput.title,
      prompt: chapterInput.prompt,
      additionalContext: chapterInput.additionalContext,
    };

    console.log('✅ Payload validado e pronto para envio');
    console.log('📋 Resumo do payload:', {
      courseId: payloadToSend.courseId,
      isIntroduction: payloadToSend.isIntroduction,
      chapterNumber: payloadToSend.chapterNumber,
      chapterOutlinesCount: payloadToSend.chapterOutlines?.length || 0,
      hasSubchapterTemplate: !!payloadToSend.subchapterTemplate,
    });

    // Envia o payload validado (sem campos extras)
    const newChapter = await aiService.createChapter(payloadToSend);

    if (!newChapter || !newChapter.id) {
      throw new Error('AI Service não retornou o capítulo gerado.');
    }

    console.log('✅ Introdução completa gerada e salva pelo AI Service:', newChapter.id);
    console.log('✅ Conteúdo gerado:', newChapter.content?.substring(0, 100) + '...');

    // 4. Revalida cache para mostrar o curso atualizado
    revalidatePath('/');
    revalidatePath(`/courses/${newCourse.id}`);

    return {
      success: true,
      data: {
        ...newCourse,
        // Inclui o capítulo de introdução gerado
        chapters: [newChapter]
      }
    };
  } catch (error) {
    console.error('❌ Erro ao criar curso:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar o curso.';
    console.error('Detalhes do erro:', {
      error: errorMessage,
      courseData: values,
      timestamp: new Date().toISOString()
    });
    return {
      success: false,
      error: `Falha ao criar curso ou gerar introdução: ${errorMessage}. Verifique se o AI Service está disponível.`
    };
  }
}

// Nova ação: Gerar primeiro capítulo (cria estrutura e prepara para subcapítulos)
export async function generateChapterFromOutlineAction(
  course: Course,
  chapterNumber: number
) {
  try {
    // Validações iniciais
    if (!course.chapterOutlines || course.chapterOutlines.length === 0) {
      return { success: false, error: 'O curso não possui ementa estruturada com capítulos.' };
    }

    if (!course.subchapterTemplate?.structure || course.subchapterTemplate.structure.length < 20) {
      return {
        success: false,
        error: 'O curso precisa ter um template de subcapítulos configurado (mínimo 20 caracteres).'
      };
    }

    // Busca introdução para contexto
    const introductionChapter = course.chapters?.find(ch => ch.isIntroduction);

    // Cria estrutura inicial do capítulo via AI Service
    // O AI Service gera a estrutura base (sem subcapítulos ainda)

    // ⚠️ NORMALIZAÇÃO DEFENSIVA: Garante que chapterOutlines tenha number e order
    // Mesmo que o Backend retorne sem esses campos, garantimos que estarão presentes
    const defensiveChapterOutlines = (course.chapterOutlines || []).map((outline, index) => {
      const number = outline.number != null && outline.number !== undefined
        ? toNumber(outline.number, index + 1)
        : index + 1;

      const order = outline.order != null && outline.order !== undefined
        ? toNumber(outline.order, number)
        : number;

      return {
        number,
        title: String(outline.title || '').trim(),
        description: String(outline.description || '').trim(),
        wordCount: toNumber(outline.wordCount, 1000),
        order,
      };
    });

    // Busca outline do capítulo específico (agora com dados normalizados)
    const targetChapterOutline = defensiveChapterOutlines.find(outline => outline.number === chapterNumber);
    if (!targetChapterOutline) {
      return { success: false, error: `Capítulo ${chapterNumber} não encontrado na ementa.` };
    }

    // Normaliza o chapterOutline específico (já garantido, mas normaliza novamente para segurança)
    const normalizedOutline = normalizeChapterOutline(targetChapterOutline, chapterNumber - 1);

    // Validações específicas do outline
    if (normalizedOutline.title.trim().length < 3) {
      return { success: false, error: `Título do capítulo deve ter pelo menos 3 caracteres.` };
    }
    if (normalizedOutline.description.trim().length < 50) {
      return { success: false, error: `Descrição do capítulo deve ter pelo menos 50 caracteres.` };
    }
    if (normalizedOutline.wordCount < 100) {
      return { success: false, error: `WordCount do capítulo deve ser >= 100.` };
    }

    // Validações do curso antes de enviar
    if (!course.title || course.title.trim().length < 3) {
      return { success: false, error: 'Título do curso deve ter pelo menos 3 caracteres.' };
    }
    if (!course.template || course.template.trim().length < 10) {
      return { success: false, error: 'Template do curso deve ter pelo menos 10 caracteres.' };
    }
    if (!course.philosophy || course.philosophy.trim().length < 10) {
      return { success: false, error: 'Filosofia do curso deve ter pelo menos 10 caracteres.' };
    }
    if (!course.subchapterTemplate?.structure || course.subchapterTemplate.structure.trim().length < 20) {
      return { success: false, error: 'Template de subcapítulos deve ter pelo menos 20 caracteres.' };
    }

    // Prepara chapterOutline (singular) para capítulo normal
    const formattedChapterOutline = {
      number: toNumber(normalizedOutline.number, chapterNumber),
      title: String(normalizedOutline.title).trim(),
      description: String(normalizedOutline.description).trim(),
      wordCount: toNumber(normalizedOutline.wordCount, 1000),
      order: toNumber(normalizedOutline.order, normalizedOutline.number),
    };

    // Validação final do chapterOutline
    if (isNaN(formattedChapterOutline.number) || formattedChapterOutline.number < 1) {
      return { success: false, error: `Número do capítulo inválido: ${formattedChapterOutline.number}` };
    }
    if (isNaN(formattedChapterOutline.wordCount) || formattedChapterOutline.wordCount < 100) {
      return { success: false, error: `WordCount inválido: ${formattedChapterOutline.wordCount}` };
    }
    if (isNaN(formattedChapterOutline.order) || formattedChapterOutline.order < 1) {
      return { success: false, error: `Order inválido: ${formattedChapterOutline.order}` };
    }

    const chapterInput: CreateChapterRequest = {
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description || '',
      // ✅ CORRETO: Quando isIntroduction=false, envia chapterOutline (singular)
      chapterOutline: formattedChapterOutline,
      subject: course.subject,
      educationalLevel: course.educationalLevel || 'Ensino Médio',
      targetAudience: course.targetAudience || 'Estudantes',
      template: course.template,
      subchapterTemplate: course.subchapterTemplate ? {
        structure: course.subchapterTemplate.structure,
        minSubchapters: course.subchapterTemplate.minSubchapters,
        maxSubchapters: course.subchapterTemplate.maxSubchapters,
        wordCountPerSubchapter: course.subchapterTemplate.wordCountPerSubchapter
      } : undefined,
      philosophy: course.philosophy,
      bibliography: course.bibliography?.map(bib => ({
        title: bib.title,
        author: bib.author,
        year: bib.year,
        url: bib.url
      })),
      title: targetChapterOutline.title,
      prompt: `Crie a estrutura inicial do capítulo "${targetChapterOutline.title}". 

Descrição do capítulo: ${targetChapterOutline.description}

Este capítulo será gerado em subcapítulos incrementais. Crie uma estrutura inicial que:
1. Apresente o tema do capítulo
2. Explique brevemente o que será abordado
3. Prepare o terreno para os subcapítulos que serão gerados posteriormente

O conteúdo deve ser gerado completamente pela IA, não apenas uma estrutura vazia.`,
      chapterNumber: chapterNumber,
      isIntroduction: false, // ✅ CRÍTICO: false para capítulo normal
      additionalContext: `Este capítulo será gerado em subcapítulos incrementais. 
      
O AI Service deve gerar uma estrutura inicial com conteúdo, mas deixar espaço para os subcapítulos serem adicionados incrementalmente.
      
Número de palavras esperado para o capítulo completo: ${targetChapterOutline.wordCount}
Número de palavras por subcapítulo: ${course.subchapterTemplate?.wordCountPerSubchapter || 'não definido'}`
    };

    // AI Service gera e salva no backend
    console.log(`Gerando estrutura inicial do capítulo ${chapterNumber} via AI Service...`);
    const newChapter = await aiService.createChapter(chapterInput);
    console.log('Capítulo criado e salvo no backend:', newChapter.id);

    revalidatePath(`/courses/${course.id}`);
    return {
      success: true,
      data: newChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar capítulo.';
    return { success: false, error: errorMessage };
  }
}

// Nova ação: Gerar subcapítulo incremental
export async function generateSubchapterAction(
  course: Course,
  chapterId: string,
  chapterNumber: number
) {
  try {
    // Validações iniciais
    if (!course.subchapterTemplate?.structure || course.subchapterTemplate.structure.length < 20) {
      return {
        success: false,
        error: 'O curso precisa ter um template de subcapítulos configurado (mínimo 20 caracteres).'
      };
    }

    // Busca capítulo atual
    const { data: chapter } = await backendService.getChapterById(chapterId);
    if (!chapter) {
      return { success: false, error: 'Capítulo não encontrado.' };
    }

    // ⚠️ NORMALIZAÇÃO DEFENSIVA: Garante que chapterOutlines tenha number e order
    // Mesmo que o Backend retorne sem esses campos, garantimos que estarão presentes
    const defensiveChapterOutlines = (course.chapterOutlines || []).map((outline, index) => {
      const number = outline.number != null && outline.number !== undefined
        ? toNumber(outline.number, index + 1)
        : index + 1;

      const order = outline.order != null && outline.order !== undefined
        ? toNumber(outline.order, number)
        : number;

      return {
        number,
        title: String(outline.title || '').trim(),
        description: String(outline.description || '').trim(),
        wordCount: toNumber(outline.wordCount, 1000),
        order,
      };
    });

    // Busca outline do capítulo (agora com dados normalizados)
    const chapterOutline = defensiveChapterOutlines.find(outline => outline.number === chapterNumber);
    if (!chapterOutline) {
      return { success: false, error: `Estrutura do capítulo ${chapterNumber} não encontrada na ementa.` };
    }

    // Calcula próximo número de subcapítulo
    // Prioriza o valor do backend (current_subchapter_number/currentSubchapterNumber) e cai para o comprimento da lista
    const nextFromBackend = Number((chapter as any).current_subchapter_number ?? (chapter as any).currentSubchapterNumber);
    const currentSubchapterNumber = Number.isFinite(nextFromBackend) && nextFromBackend >= 1
      ? nextFromBackend
      : ((Array.isArray(chapter.subchapters) ? chapter.subchapters.length : 0) + 1);

    // Prepara subcapítulos existentes para contexto
    const existingSubchapters = chapter.subchapters
      ?.sort((a, b) => a.subchapter_number - b.subchapter_number)
      .map(sub => ({
        number: sub.subchapter_number,
        title: sub.title,
        content: sub.content
      })) || [];

    // Busca introdução para contexto
    const introductionChapter = course.chapters?.find(ch => ch.isIntroduction);

    // NOTA: Alternativamente, você pode usar a função helper:
    // const request = prepareSubchapterPayload(course, chapter, currentSubchapterNumber);
    // Isso simplifica o código e garante todas as validações conforme o guia.
    // O código atual é mais explícito e oferece mais controle sobre o processo.

    // Monta requisição
    const request: GenerateSubchapterRequest = {
      courseId: course.id,
      chapterId: chapter.id,
      chapterNumber: chapterNumber,
      chapterTitle: chapter.title,
      chapterOutline: {
        number: chapterOutline.number,
        title: chapterOutline.title,
        description: chapterOutline.description,
        wordCount: chapterOutline.wordCount,
        order: chapterOutline.order || chapterOutline.number // Garante order para consistência
      },
      subchapterNumber: currentSubchapterNumber,
      existingSubchapters: existingSubchapters.length > 0 ? existingSubchapters : undefined,
      courseTitle: course.title,
      courseDescription: course.description,
      subject: course.subject,
      educationalLevel: course.educationalLevel || 'Ensino Médio',
      targetAudience: course.targetAudience || 'Estudantes',
      template: course.template,
      subchapterTemplate: course.subchapterTemplate, // Já validado acima
      philosophy: course.philosophy,
      bibliography: course.bibliography?.map(bib => ({
        title: bib.title,
        author: bib.author,
        year: bib.year,
        url: bib.url
      })),
      introductionContent: introductionChapter?.content
    };

    // AI Service gera o subcapítulo completo e atualiza o capítulo no backend
    console.log(`Gerando subcapítulo ${currentSubchapterNumber} do capítulo ${chapterNumber} via AI Service...`);
    const updatedChapter = await aiService.generateSubchapter(request);

    if (!updatedChapter || !updatedChapter.id) {
      throw new Error('AI Service não retornou o capítulo atualizado.');
    }

    console.log('✅ Subcapítulo gerado e salvo pelo AI Service:', updatedChapter.id);

    // Verifica se o subcapítulo foi adicionado
    const newSubchapters = updatedChapter.subchapters || [];
    const newSubchapter = newSubchapters.find(sub => sub.subchapter_number === currentSubchapterNumber);
    if (newSubchapter) {
      console.log(`✅ Subcapítulo ${currentSubchapterNumber} criado: "${newSubchapter.title}"`);
      console.log(`   Palavras: ${newSubchapter.wordCount || 'N/A'}`);
    }

    revalidatePath(`/courses/${course.id}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar subcapítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar subcapítulo.';
    return { success: false, error: errorMessage };
  }
}


export async function generateChapterAction(
  course: Course,
  values: { title: string; prompt: string }
) {
  try {
    const input: CreateChapterRequest = {
      courseId: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      subject: course.subject,
      educationalLevel: course.educationalLevel || 'Ensino Médio',
      targetAudience: course.targetAudience || 'Estudantes',
      template: course.template,
      philosophy: course.philosophy,
      title: values.title,
      prompt: values.prompt,
      chapterNumber: (course.chapters?.length || 0) + 1,
      additionalContext: `Título do Capítulo: ${values.title}\n\nInstruções: ${values.prompt}`
    };

    const newChapter = await aiService.createChapter(input);
    console.log('Capítulo gerado e salvo no backend:', newChapter.id);

    revalidatePath(`/courses/${course.id}`);
    return {
      success: true,
      data: newChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar capítulo.';
    console.error('Detalhes do erro:', {
      error: errorMessage,
      courseId: course.id,
      chapterData: values,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: errorMessage };
  }
}

export async function expandChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Expanda o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;

    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'expand',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao expandir capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao expandir capítulo.';
    return { success: false, error: errorMessage };
  }
}


export async function simplifyChapterAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Simplifique o seguinte trecho de texto: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'simplify',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao simplificar capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao simplificar capítulo.';
    return { success: false, error: errorMessage };
  }
}

export async function generateQuestionAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Gere uma questão de avaliação (múltipla escolha ou dissertativa) sobre o seguinte trecho: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'assess',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao gerar questão:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao gerar questão.';
    return { success: false, error: errorMessage };
  }
}

export async function createExampleAction(
  courseId: string,
  chapterId: string,
  values: {
    selection: string;
    additionalDetails?: string;
  }
) {
  try {
    const context = `Crie um exemplo prático, uma analogia ou um estudo de caso sobre o seguinte conceito: "${values.selection}".\nInstruções adicionais: ${values.additionalDetails || 'Nenhuma.'}`;
    const updatedChapter = await aiService.continueChapter(
      chapterId,
      'exemplify',
      context
    );

    revalidatePath(`/courses/${courseId}`);
    return {
      success: true,
      data: updatedChapter,
    };
  } catch (error) {
    console.error('Erro ao criar exemplo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao criar exemplo.';
    return { success: false, error: errorMessage };
  }
}


export async function enrichChapterAction(
  chapter: Chapter,
  values: {
    userQuery: string;
  }
) {
  try {
    const updatedChapter = await aiService.continueChapter(
      chapter.id,
      'expand',
      `Enriquecer o seguinte conteúdo com base na consulta do usuário: "${values.userQuery}". Conteúdo existente: "${chapter.content}"`
    );

    const courseId = (updatedChapter as any).course_id || (updatedChapter as any).courseId;
    if (courseId) {
      revalidatePath(`/courses/${courseId}`);
    }
    return {
      success: true,
      data: {
        ...updatedChapter,
        aiUsed: true
      },
    };
  } catch (error) {
    console.error('Erro ao enriquecer capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao enriquecer capítulo.';
    return { success: false, error: errorMessage };
  }
}

export async function updateChapterContentAction(
  courseId: string,
  chapterId: string,
  oldContent: string,
  newContent: string,
  isFullEdit: boolean
) {
  try {
    const { data: chapter } = await backendService.getChapterById(chapterId);
    if (!chapter) {
      throw new Error("Capítulo não encontrado.");
    }

    const updatedContent = isFullEdit ? newContent : chapter.content.replace(oldContent, newContent);

    const result = await backendService.updateChapter(chapterId, { content: updatedContent });

    if (result.success) {
      revalidatePath(`/courses/${courseId}`);
      return { success: true, data: result.data };
    }

    return { success: false, error: 'Falha ao atualizar capítulo' };

  } catch (error) {
    console.error('Erro ao atualizar conteúdo do capítulo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao atualizar o conteúdo.';
    return { success: false, error: errorMessage };
  }
}

// ===== NOVAS FUNCIONALIDADES DE TRANSFORMAÇÃO INTELIGENTE =====

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}

export async function transformChapterContent(
  chapterId: string,
  continueType: 'expand' | 'simplify' | 'exemplify' | 'assess' | 'add_section' | 'add_activities' | 'add_assessments',
  selectedText: string,
  additionalContext?: string
): Promise<ActionResult> {
  try {
    if (!chapterId || !continueType || !selectedText) {
      return {
        success: false,
        error: 'Parâmetros obrigatórios não fornecidos',
        message: 'Erro de validação: chapterId, continueType e selectedText são obrigatórios'
      };
    }

    const cleanText = selectedText.replace(/<[^>]*>/g, '').trim();

    if (cleanText.length < 10) {
      return {
        success: false,
        error: 'Texto muito curto',
        message: 'O texto selecionado deve ter pelo menos 10 caracteres'
      };
    }

    const request: TransformRequest = {
      chapterId,
      continueType,
      selectedText: cleanText,
      additionalContext
    };

    const result = await aiServiceClient.transformContent(request);

    revalidatePath(`/courses/[id]`);
    revalidatePath(`/courses/[id]/chapters/[chapterId]`);

    return {
      success: true,
      data: result,
      message: 'Conteúdo transformado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao transformar conteúdo:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Erro ao transformar conteúdo. Tente novamente.'
    };
  }
}

export async function expandSelectedContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'expand', selectedText, additionalDetails);
}

export async function simplifySelectedContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'simplify', selectedText, additionalDetails);
}

export async function createExampleForContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'exemplify', selectedText, additionalDetails);
}

export async function generateQuestionForContent(
  chapterId: string,
  selectedText: string,
  additionalDetails?: string
): Promise<ActionResult> {
  return transformChapterContent(chapterId, 'assess', selectedText, additionalDetails);
}
