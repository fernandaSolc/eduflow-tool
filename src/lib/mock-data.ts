import type { Course, Chapter } from './definitions';

const mockChapters: Chapter[] = [
  {
    id: 'ch-1',
    courseId: 'mock-course-1',
    chapterNumber: 1,
    title: 'Capítulo 1: A Revolução da IA na Educação',
    content: `<h2>O Início de Uma Nova Era</h2>
<p>A inteligência artificial (IA) está rapidamente se tornando uma das tecnologias mais transformadoras do nosso tempo. No setor educacional, seu impacto é particularmente profundo, prometendo personalizar o aprendizado, automatizar tarefas administrativas e fornecer insights valiosos para educadores.</p>
<p>Neste capítulo, exploraremos os conceitos fundamentais da IA e como eles se aplicam ao contexto da criação de conteúdo didático. Vamos desmistificar termos como <em>Machine Learning</em>, <em>Natural Language Processing (NLP)</em> e <em>Generative AI</em>.</p>
<br />
<h3>Principais Conceitos</h3>
<ul>
<li><strong>Machine Learning:</strong> A capacidade de um sistema aprender e melhorar a partir da experiência sem ser explicitamente programado.</li>
<li><strong>Natural Language Processing (NLP):</strong> A área da IA focada em permitir que computadores entendam, interpretem e gerem linguagem humana.</li>
<li><strong>Generative AI:</strong> Modelos de IA capazes de criar novo conteúdo, como texto, imagens ou música, com base nos dados com os quais foram treinados.</li>
</ul>
<br/>
<div class="image-placeholder" contenteditable="false" data-image-description="Um diagrama mostrando a relação entre IA, Machine Learning e NLP.">
  <div class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>
  <div class="placeholder-text"><strong>Imagem Sugerida:</strong><p>Um diagrama mostrando a relação entre IA, Machine Learning e NLP.</p></div>
</div>
<br/>
<p>A adoção dessas tecnologias não está isenta de desafios. Questões éticas, como o viés nos dados de treinamento e a privacidade dos alunos, são de suma importância e serão discutidas ao longo deste curso.</p>
    `,
    sections: [],
    status: 'gerado',
    createdAt: '2023-10-26T10:00:00Z',
    updatedAt: '2023-10-26T11:00:00Z',
    metrics: {
      readabilityScore: 75,
      durationMin: 5,
      coverage: 90,
    },
    suggestions: ['Adicionar um exemplo prático de NLP na sala de aula.', 'Explorar o impacto social da IA.'],
    canContinue: true,
    availableContinueTypes: ['expand', 'add_section', 'add_activities'],
  },
  {
    id: 'ch-2',
    courseId: 'mock-course-1',
    chapterNumber: 2,
    title: 'Capítulo 2: Ferramentas de Autoria Inteligente',
    content: `
      <h2>Construindo o Futuro da Criação de Conteúdo</h2>
      <p>Com a base teórica estabelecida, é hora de mergulhar nas ferramentas práticas. Ferramentas de autoria inteligente, como a que você está usando, integram o poder da IA diretamente no fluxo de trabalho do criador de conteúdo.</p>
      <p>Essas ferramentas podem:</p>
      <ul>
        <li>Sugerir melhorias de clareza e estilo.</li>
        <li>Expandir seções com informações adicionais relevantes.</li>
        <li>Gerar exemplos, analogias e até mesmo pequenas avaliações.</li>
        <li>Adaptar o conteúdo para diferentes públicos e níveis de conhecimento.</li>
      </ul>
      <br/>
      <p>O segredo para um uso eficaz é a colaboração homem-máquina. A IA é uma copiloto poderosa, mas a visão pedagógica e a expertise do educador são insubstituíveis. O objetivo não é substituir o criador, mas sim aumentar sua capacidade e eficiência.</p>
      <br />
      <h3>Boas Práticas</h3>
      <ol>
        <li><strong>Fornecer contexto claro:</strong> Quanto mais específica for sua instrução (prompt), melhor será o resultado.</li>
        <li><strong>Revisar e refinar:</strong> Sempre revise o conteúdo gerado para garantir precisão, adequação e alinhamento com seus objetivos pedagógicos.</li>
        <li><strong>Iterar:</strong> Use as sugestões da IA como um ponto de partida e continue a refinar o conteúdo em um ciclo de feedback.</li>
      </ol>
    `,
    sections: [],
    status: 'rascunho',
    createdAt: '2023-10-27T14:00:00Z',
    updatedAt: '2023-10-27T15:30:00Z',
    metrics: {
      readabilityScore: 80,
      durationMin: 7,
      coverage: 85,
    },
    suggestions: ['Adicionar um estudo de caso.', 'Criar um glossário de termos técnicos.'],
    canContinue: true,
    availableContinueTypes: ['expand', 'add_section', 'add_assessments'],
  },
];

export const mockCourse: Course = {
  id: 'mock-course-1',
  title: 'Curso Mocado: IA para Educadores',
  description: 'Um curso de exemplo para demonstrar as capacidades da plataforma Eduflow. Explore como a Inteligência Artificial pode revolucionar a criação de conteúdo educacional.',
  subject: 'Tecnologia Educacional',
  educationalLevel: 'Ensino Superior',
  targetAudience: 'Professores e criadores de conteúdo',
  template: 'default_template',
  philosophy: 'Aprendizagem assistida por tecnologia com foco no humano.',
  status: 'ativo',
  createdAt: '2023-10-26T09:00:00Z',
  updatedAt: '2023-10-27T15:30:00Z',
  chapters: mockChapters,
};

export const mockCourses: Course[] = [mockCourse];
