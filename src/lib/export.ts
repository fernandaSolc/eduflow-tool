'use client';

import type { Course, Chapter } from '@/lib/definitions';

function sanitizeHtml(html: string | undefined | null): string {
	if (!html) return '';
	return String(html)
		.replace(/\u0000/g, '')
		.trim();
}

function buildChapterHtml(chapter: any, chapterIndex?: number): string {
	const title = sanitizeHtml(chapter?.title);
	const isIntroduction = !!(chapter?.isIntroduction || chapter?.is_introduction);
	const content = sanitizeHtml(chapter?.content);
	const chapterNum = isIntroduction
		? undefined
		: (chapter?.chapterNumber || chapter?.chapter_number || chapterIndex || undefined);

	// Subcapítulos (se existirem)
	const subs = Array.isArray(chapter?.subchapters)
		? chapter.subchapters
			.sort((a: any, b: any) => (a.subchapter_number || a.number || 0) - (b.subchapter_number || b.number || 0))
			.map((s: any) => {
				const subN = s?.subchapter_number || s?.number;
				const composedTitle = chapterNum && subN ? `${chapterNum}.${subN} ${sanitizeHtml(s.title)}` : sanitizeHtml(s.title);
				return `
			<section>
				<h3>${composedTitle}</h3>
				<div>${sanitizeHtml(s.content)}</div>
			</section>`;
			})
			.join('\n')
		: '';

	const heading = isIntroduction
		? `<h2>Introdução</h2>`
		: `<h2>Capítulo ${chapterNum ? String(chapterNum) + ': ' : ''}${title}</h2>`;

	return `
	<section>
		${heading}
		${content ? `<div>${content}</div>` : ''}
		${subs}
	</section>`;
}

export function buildCourseHtml(course: Course): string {
	const courseTitle = sanitizeHtml(course.title);

	const outlines = Array.isArray(course.chapterOutlines) ? course.chapterOutlines : [];
	const intro = course.chapters?.find((c) => c.isIntroduction) || null;
	const normals = (course.chapters || []).filter((c) => !c.isIntroduction);

	const introHtml = intro ? buildChapterHtml(intro) : '';
	const chaptersHtml = normals
		.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
		.map((ch) => {
			const idx = outlines.find((o) => o.title === ch.title)?.number || ch.chapterNumber;
			return buildChapterHtml(ch, idx);
		})
		.join('\n<div class="page-break"></div>\n');

	return `
	<!doctype html>
	<html lang="pt-BR">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${courseTitle}</title>
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; padding: 24px; color: #111; }
			h1 { font-size: 26px; margin: 0 0 8px; }
			h2 { font-size: 22px; margin: 20px 0 8px; }
			h3 { font-size: 18px; margin: 14px 0 6px; }
			p { margin: 8px 0; }
			section { margin: 10px 0; }
			.page-break { page-break-after: always; }
		</style>
	</head>
	<body>
		<header>
			<h1>${courseTitle}</h1>
		</header>
		<main>
			${introHtml}
			${introHtml ? '<div class="page-break"></div>' : ''}
			${chaptersHtml}
		</main>
	</body>
	</html>`;
}

function removeStyleAndScript(root: HTMLElement) {
	root.querySelectorAll('style, script').forEach((el) => el.remove());
}

async function htmlToDocxParagraphs(root: HTMLElement) {
	const { Paragraph, HeadingLevel, TextRun } = await import('docx');
	const paragraphs: any[] = [];

	function pushParagraph(text: string, heading?: keyof typeof HeadingLevel) {
		const runs = [new TextRun(text)];
		if (heading) {
			paragraphs.push(new Paragraph({ text, heading: HeadingLevel[heading] }));
		} else {
			paragraphs.push(new Paragraph({ children: runs }));
		}
	}

	function walk(node: Node) {
		if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as HTMLElement;
			const tag = el.tagName.toLowerCase();
			if (el.classList.contains('page-break')) {
				// quebra de página antes do próximo conteúdo
				paragraphs.push(new Paragraph({ children: [new TextRun('')], pageBreakBefore: true }));
				return;
			}
			switch (tag) {
				case 'h1':
					pushParagraph(el.textContent || '', 'TITLE');
					return;
				case 'h2':
					pushParagraph(el.textContent || '', 'HEADING_1');
					return;
				case 'h3':
					pushParagraph(el.textContent || '', 'HEADING_2');
					return;
				case 'h4':
					pushParagraph(el.textContent || '', 'HEADING_3');
					return;
				case 'p':
				case 'div':
					{
						const txt = (el.textContent || '').trim();
						if (txt) pushParagraph(txt);
					}
					return;
				case 'li':
					pushParagraph(`• ${(el.textContent || '').trim()}`);
					return;
				default:
					// caminha filhos
					Array.from(el.childNodes).forEach(walk);
					return;
			}
		}
		if (node.nodeType === Node.TEXT_NODE) {
			const txt = (node.textContent || '').trim();
			if (txt) pushParagraph(txt);
		}
	}

	Array.from(root.childNodes).forEach(walk);
	return paragraphs;
}

export async function downloadDocxFromHtml(html: string, filename: string) {
	const { Document, Packer } = await import('docx');
	const container = document.createElement('div');
	container.innerHTML = html;
	removeStyleAndScript(container);
	const children = await htmlToDocxParagraphs(container);
	const doc = new Document({ sections: [{ children }] });
	const blob = await Packer.toBlob(doc);
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
	a.click();
	URL.revokeObjectURL(a.href);
}

function htmlToPlainParagraphs(html: string): string[] {
	const temp = document.createElement('div');
	temp.innerHTML = html || '';
	removeStyleAndScript(temp);
	// Quebra por blocos e linhas
	const blocks = Array.from(temp.querySelectorAll('p, div, li, h1, h2, h3, h4'));
	if (blocks.length > 0) {
		return blocks
			.map((b) => (b.textContent || '').trim())
			.filter((t) => t.length > 0);
	}
	const txt = temp.innerText || temp.textContent || '';
	return txt
		.replace(/\r/g, '')
		.split(/\n{2,}|\n/)
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function downloadCourseDocx(course: Course, filename: string) {
	const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import('docx');

	// Configura estilos e numeração "nativos" do Word
	const children: any[] = [];

	// Título do curso (Title) com destaque
	children.push(
		new Paragraph({
			text: sanitizeHtml(course.title),
			heading: HeadingLevel.TITLE,
		})
	);

	const outlines = Array.isArray(course.chapterOutlines) ? course.chapterOutlines : [];
	const intro = course.chapters?.find((c) => c.isIntroduction) || null;
	const normals = (course.chapters || []).filter((c) => !c.isIntroduction);

	// Introdução (Heading1)
	if (intro) {
		children.push(new Paragraph({ text: 'Introdução', heading: HeadingLevel.HEADING_1 }));
		const introParas = htmlToPlainParagraphs(sanitizeHtml(intro.content));
		introParas.forEach((t) =>
			children.push(
				new Paragraph({
					children: [new TextRun({ text: t })],
				})
			)
		);
	}

	// Capítulos
	const sorted = normals.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
	sorted.forEach((ch, i) => {
		const idx = outlines.find((o) => o.title === ch.title)?.number || ch.chapterNumber;
		const capTitle = `Capítulo ${idx ?? ''}${idx ? ': ' : ''}${sanitizeHtml(ch.title)}`;

		// Quebra de página antes de cada capítulo (após o primeiro conteúdo)
		children.push(
			new Paragraph({
				text: capTitle,
				heading: HeadingLevel.HEADING_1,
				pageBreakBefore: children.length > 0,
			})
		);

		// Conteúdo do capítulo
		const capParas = htmlToPlainParagraphs(sanitizeHtml(ch.content));
		capParas.forEach((t) => {
			// Lista simples quando linha começa com marcador
			const isBullet = /^([•\-\*]\s+)/.test(t);
			const text = t.replace(/^([•\-\*]\s+)/, '').trim();
			children.push(
				new Paragraph(
					isBullet
						? { children: [new TextRun({ text })], bullet: { level: 0 } as any }
						: { children: [new TextRun({ text })] }
				)
			);
		});

		// Subcapítulos
		const subs = Array.isArray(ch.subchapters)
			? ch.subchapters.sort(
				(a: any, b: any) => (a.subchapter_number || a.number || 0) - (b.subchapter_number || b.number || 0)
			)
			: [];
		subs.forEach((s: any) => {
			const subN = s?.subchapter_number || s?.number;
			const heading = idx && subN ? `${idx}.${subN} ${sanitizeHtml(s.title)}` : sanitizeHtml(s.title);
			children.push(new Paragraph({ text: heading, heading: HeadingLevel.HEADING_2 }));
			const paras = htmlToPlainParagraphs(sanitizeHtml(s.content));
			paras.forEach((t) => {
				const isBullet = /^([•\-\*]\s+)/.test(t);
				const text = t.replace(/^([•\-\*]\s+)/, '').trim();
				children.push(
					new Paragraph(
						isBullet
							? { children: [new TextRun({ text })], bullet: { level: 0 } as any }
							: { children: [new TextRun({ text })] }
					)
				);
			});
		});
	});

	const doc = new Document({
		sections: [
			{
				properties: {
					page: {
						margin: { top: 720, right: 720, bottom: 720, left: 920 }, // ~1" (twips)
					},
				},
				children,
			},
		],
		styles: {
			paragraphStyles: [
				{
					id: 'Normal',
					name: 'Normal',
					basedOn: 'Normal',
					run: { size: 24 }, // 12pt
					paragraph: { spacing: { after: 160 } },
				},
				{
					id: 'Title',
					name: 'Title',
					basedOn: 'Normal',
					run: { size: 36, bold: true }, // 18pt
					paragraph: { spacing: { after: 240 } },
				},
				{
					id: 'Heading1',
					name: 'Heading 1',
					basedOn: 'Normal',
					run: { size: 30, bold: true }, // 15pt
					paragraph: { spacing: { before: 240, after: 120 } },
				},
				{
					id: 'Heading2',
					name: 'Heading 2',
					basedOn: 'Normal',
					run: { size: 26, bold: true }, // 13pt
					paragraph: { spacing: { before: 160, after: 80 } },
				},
			],
		},
	});

	const blob = await Packer.toBlob(doc);
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
	a.click();
	URL.revokeObjectURL(a.href);
}

export async function downloadPdfFromHtml(html: string, filename: string) {
	// Gera PDF client-side com html2pdf.js
	const html2pdf = (await import('html2pdf.js')).default;
	const container = document.createElement('div');
	container.style.position = 'fixed';
	container.style.left = '-99999px';
	container.innerHTML = html;
	document.body.appendChild(container);
	await html2pdf()
		.from(container)
		.set({
			margin: [10, 10, 10, 10],
			filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: { scale: 2, useCORS: true },
			jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
		})
		.save();
	document.body.removeChild(container);
}


