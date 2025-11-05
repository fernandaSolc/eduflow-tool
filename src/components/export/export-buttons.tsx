'use client';

import { useState } from 'react';
import type { Course } from '@/lib/definitions';
import { downloadCourseDocx } from '@/lib/export';
import { Button } from '@/components/ui/button';

type Props = {
	course: Course;
};

export function ExportButtons({ course }: Props) {
	const [loading, setLoading] = useState<'docx' | null>(null);

	async function handleExport(format: 'docx') {
		try {
			setLoading(format);
			const base = `${course.title || 'curso'}`.replace(/[^a-z0-9\-\_\s]/gi, '').trim() || 'curso';
			const filename = `${base}-completo`;
			await downloadCourseDocx(course, filename);
			if (typeof window !== 'undefined') {
				try { console.info('Download iniciado: DOCX'); } catch {}
			}
		} catch (err: any) {
			if (typeof window !== 'undefined') {
				alert(`Falha ao exportar: ${err?.message || 'Verifique dependências (docx).'}\nDica: npm i docx --save`);
			}
		} finally {
			setLoading(null);
		}
	}

	return (
		<div className="flex gap-2">
			<Button variant="secondary" disabled={loading !== null} onClick={() => handleExport('docx')}>
				{loading === 'docx' ? 'Gerando DOCX...' : 'Baixar DOCX'}
			</Button>
		</div>
	);
}

export default ExportButtons;


