import React from 'react';
import { AlertTriangle, BookOpen, Lightbulb, ArrowLeftRight } from 'lucide-react';
import type { ContentBlock } from '../../types/modules';

/** Highlight keywords within text using bold + colored spans */
const highlightKeywords = (text: string, keywords?: string[]): React.ReactNode => {
    if (!keywords || keywords.length === 0) return formatInlineMarkdown(text);

    const escaped = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) => {
        if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
            return <strong key={i} className="text-blue-700 dark:text-blue-400 font-semibold">{part}</strong>;
        }
        return <React.Fragment key={i}>{formatInlineMarkdown(part)}</React.Fragment>;
    });
};

/** Parse **bold** inline markdown */
const formatInlineMarkdown = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

interface Props {
    block: ContentBlock;
}

export const ContentBlockRenderer: React.FC<Props> = ({ block }) => {
    switch (block.type) {
        case 'heading':
            return (
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors">
                    {block.content}
                </h3>
            );

        case 'paragraph':
            return (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 transition-colors">
                    {highlightKeywords(block.content, block.keywords)}
                </p>
            );

        case 'key_definition':
            return (
                <div className="bg-indigo-50 dark:bg-indigo-900/15 rounded-xl p-5 border border-indigo-200 dark:border-indigo-800/50 relative overflow-hidden mb-6 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 dark:bg-indigo-400"></div>
                    <h4 className="text-base font-bold text-indigo-900 dark:text-indigo-400 flex items-center mb-2 transition-colors">
                        <BookOpen size={18} className="mr-2 text-indigo-600 dark:text-indigo-400" />
                        {block.label || 'Définition'}
                    </h4>
                    <p className="text-indigo-800 dark:text-indigo-200/90 leading-relaxed transition-colors">
                        {highlightKeywords(block.content, block.keywords)}
                    </p>
                </div>
            );

        case 'exam_trap':
            return (
                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50 relative overflow-hidden mb-6 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 dark:bg-amber-600"></div>
                    <h4 className="text-base font-bold text-amber-900 dark:text-amber-500 flex items-center mb-2 transition-colors">
                        <AlertTriangle size={18} className="mr-2 text-amber-600 dark:text-amber-500" />
                        {block.label || 'Piège à l\'examen'}
                    </h4>
                    <p className="text-amber-800 dark:text-amber-200/90 leading-relaxed transition-colors">
                        {highlightKeywords(block.content, block.keywords)}
                    </p>
                </div>
            );

        case 'example':
            return (
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800/50 relative overflow-hidden mb-6 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 dark:bg-emerald-600"></div>
                    <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-400 flex items-center mb-2 transition-colors">
                        <Lightbulb size={18} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                        {block.label || 'Exemple'}
                    </h4>
                    <p className="text-emerald-800 dark:text-emerald-200/90 leading-relaxed transition-colors">
                        {highlightKeywords(block.content, block.keywords)}
                    </p>
                </div>
            );

        case 'formula':
            return (
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
                    {block.label && (
                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-3 transition-colors">
                            {block.label}
                        </h4>
                    )}
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-mono text-sm transition-colors">
                        {highlightKeywords(block.content, block.keywords)}
                    </p>
                </div>
            );

        case 'bullet_list':
            return (
                <div className="mb-6">
                    {block.content && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 transition-colors">
                            {block.content}
                        </p>
                    )}
                    <ul className="space-y-2">
                        {block.items?.map((item, i) => (
                            <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 transition-colors">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-2.5 mr-3 shrink-0"></span>
                                <span className="leading-relaxed text-sm">{formatInlineMarkdown(item)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            );

        case 'numbered_list':
            return (
                <div className="mb-6">
                    {block.content && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 transition-colors">
                            {block.content}
                        </p>
                    )}
                    <ol className="space-y-3">
                        {block.items?.map((item, i) => (
                            <li key={i} className="flex items-start text-slate-700 dark:text-slate-300 transition-colors">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xs mr-3 mt-0.5 transition-colors">
                                    {i + 1}
                                </span>
                                <span className="leading-relaxed text-sm">{formatInlineMarkdown(item)}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            );

        case 'table':
            return (
                <div className="mb-6 overflow-x-auto">
                    {block.content && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 transition-colors">
                            {block.content}
                        </p>
                    )}
                    <table className="w-full text-sm border-collapse">
                        {block.headers && (
                            <thead>
                                <tr>
                                    {block.headers.map((h, i) => (
                                        <th key={i} className="text-left p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 transition-colors">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                        )}
                        <tbody>
                            {block.rows?.map((row, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                                    {row.map((cell, j) => (
                                        <td key={j} className="p-3 text-slate-700 dark:text-slate-300 transition-colors">
                                            {formatInlineMarkdown(cell)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

        case 'comparison':
            return (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <ArrowLeftRight size={18} className="text-slate-500 dark:text-slate-400" />
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 transition-colors">
                            {block.label || 'Comparaison'}
                        </h4>
                    </div>
                    {block.content && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 transition-colors">
                            {block.content}
                        </p>
                    )}
                    <div className="space-y-2">
                        {block.items?.map((item, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-colors">
                                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed transition-colors">
                                    {formatInlineMarkdown(item)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        default:
            return (
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4 transition-colors">
                    {block.content}
                </p>
            );
    }
};
