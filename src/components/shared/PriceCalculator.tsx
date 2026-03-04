import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { calculateIncoterms } from '../../core/calculatorLogic';

// Composants fantômes simulant Shadcn/UI (à remplacer par de vrais composants plus tard)
const Input = ({ value, onChange, type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
    // Pour les inputs numériques : on garde une string locale pour éviter le "0" en tête
    const [localVal, setLocalVal] = useState(String(value ?? ''));

    // Sync depuis le parent uniquement quand la valeur change via reset ou programmatique
    useEffect(() => {
        setLocalVal(prev => {
            const parentStr = String(value ?? '');
            // Ne pas écraser si l'utilisateur est en train de taper (ex: champ vide → parent envoie "0")
            if (prev === '' && parentStr === '0') return prev;
            if (Number(prev) === Number(parentStr)) return prev;
            return parentStr;
        });
    }, [value]);

    if (type === 'number') {
        return (
            <input
                {...props}
                type="number"
                value={localVal}
                onChange={e => {
                    const raw = e.target.value;
                    setLocalVal(raw);
                    // Propage au parent sous forme numérique
                    if (onChange) {
                        const syntheticEvent = { ...e, target: { ...e.target, value: raw === '' ? '0' : raw } };
                        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
                    }
                }}
                className={`flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent ${props.className || ''}`}
            />
        );
    }

    return (
        <input
            {...props}
            type={type}
            value={value}
            onChange={onChange}
            className={`flex h-10 w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 focus:border-transparent ${props.className || ''}`}
        />
    );
};

const Label = ({ children, className, onClick, title }: { children: React.ReactNode; className?: string; onClick?: () => void; title?: string }) => (
    <label onClick={onClick} title={title} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700 dark:text-slate-300 ${className || ''}`}>
        {children}
    </label>
);

const Accordion = ({ children, className }: { children: React.ReactNode, className?: string }) => <div className={`w-full ${className || ''}`}>{children}</div>;
const AccordionItem = ({ children, title }: { children: React.ReactNode, title: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 mb-6 overflow-hidden">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200">
                {title}
                <svg className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white dark:bg-slate-800">
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Switch Component
const Switch = ({ checked, onCheckedChange, id }: { checked: boolean, onCheckedChange: (checked: boolean) => void, id?: string }) => (
    <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-slate-900 dark:bg-slate-100' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
        <span className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-2 dark:bg-slate-900' : '-translate-x-2'}`} />
    </button>
);

// Types internes pour la démo
export type TransportMode = 'MULTIMODAL' | 'MARITIME';

export const PriceCalculator: React.FC = () => {
    const { t } = useTranslation();
    // --- ÉTAT DU FORMULAIRE ---
    const [mode, setMode] = useState<'MULTIMODAL' | 'MARITIME'>('MULTIMODAL');
    const [activeTab, setActiveTab] = useState<'saisie' | 'resultats'>('saisie');

    // -- COÛTS DE BASE --(en euros pour simplifier)
    const [coutRevient, setCoutRevient] = useState<number>(10000);
    const [emballageExport, setEmballageExport] = useState<number>(200);
    const [preAcheminement, setPreAcheminement] = useState<number>(500);
    const [douaneExport, setDouaneExport] = useState<number>(150);
    // Frais annexes départ (THC, passage portuaire, BL, etc.)
    const [miseFob, setMiseFob] = useState<number>(300);

    const [tauxChange, setTauxChange] = useState<number>(1); // 1 par défaut
    const [deviseArrivee, setDeviseArrivee] = useState<string>('USD');
    const [isCurrencyConverted, setIsCurrencyConverted] = useState<boolean>(false);

    const [fretPrincipal, setFretPrincipal] = useState<number>(1200);
    const [bafRate, setBafRate] = useState<number>(0);      // BAF % (0 par défaut)
    const [cafRate, setCafRate] = useState<number>(0);      // CAF % (0 par défaut)
    const [fraisDocumentaires, setFraisDocumentaires] = useState<number>(0);
    const [isBilledInBaseCurrency, setIsBilledInBaseCurrency] = useState<boolean>(true);
    const [tauxAssurance, setTauxAssurance] = useState<number>(0.5); // 0.5%
    const [coeffMajorationAssurance, setCoeffMajorationAssurance] = useState<number>(10); // 10% = standard
    const [isInsuranceCircular, setIsInsuranceCircular] = useState<boolean>(true);

    const [postAcheminement, setPostAcheminement] = useState<number>(400);
    const [dechargementDestination, setDechargementDestination] = useState<number>(100);
    const [douaneImport, setDouaneImport] = useState<number>(850);

    // --- LOGIQUE MÉTIER SIMPLIFIÉE (CASCADE) ---
    const cascade = useMemo(() => {
        return calculateIncoterms({
            mode,
            valeurMarchandise: coutRevient,
            emballageExport,
            dedouanementPreAch: preAcheminement + douaneExport,
            miseABord: miseFob,
            fraisDocumentaires,
            isBilledInBaseCurrency,
            tauxChange,
            isCurrencyConverted,
            isInsuranceCircular,
            fretBase: fretPrincipal,
            bafPct: bafRate,
            cafPct: cafRate,
            tauxAssurancePct: tauxAssurance,
            majorationAssurancePct: coeffMajorationAssurance,
            postAcheminement,
            dechargementDestination,
            douaneImport,
        });
    }, [mode, coutRevient, emballageExport, preAcheminement, douaneExport, miseFob, fraisDocumentaires, isBilledInBaseCurrency, fretPrincipal, bafRate, cafRate, tauxAssurance, coeffMajorationAssurance, isInsuranceCircular, postAcheminement, dechargementDestination, douaneImport, tauxChange, isCurrencyConverted]);

    // Formatage monétaire : protection contre JS natif qui crash si devise != 3 lettres
    const formatCurrency = (val: number, currency = 'EUR') => {
        const safeCurrency = currency && currency.length === 3 ? currency : 'EUR';
        try {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: safeCurrency }).format(val);
        } catch (e) {
            return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);
        }
    };

    // Helper pour les lignes de la cascade
    const Row = ({ label, value, isCustoms = false, isMaritime = false, note, currency = 'EUR' }: { label: string, value: number, isCustoms?: boolean, isMaritime?: boolean, note?: string, currency?: string }) => {
        if (value <= 0) return null;

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex flex-col p-3 sm:p-4 border-l-4 rounded-r-lg mb-2 shadow-sm transition-colors ${isCustoms
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isMaritime
                        ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                        : 'border-slate-800 dark:border-slate-400 bg-white dark:bg-slate-800'
                    }`}
            >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg ${isCustoms ? 'text-blue-800 dark:text-blue-400' : isMaritime ? 'text-cyan-800 dark:text-cyan-400' : 'text-slate-800 dark:text-slate-200'}`}>
                            {label}
                        </span>
                        {isCustoms && (
                            <span className="text-xs font-semibold px-2 py-1 bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded-full">
                                {t('calculator.eu_customs_value')}
                            </span>
                        )}
                    </div>
                    <span className={`font-mono font-medium text-lg ${isCustoms ? 'text-blue-900 dark:text-blue-300' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(value, currency)}
                    </span>
                </div>
                {note && (
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 italic">
                        {note}
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-40 md:pb-8 p-4 md:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-200 min-h-[100dvh] font-sans">
            <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors">{t('calculator.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 transition-colors">{t('calculator.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => {
                            setMode('MULTIMODAL');
                            setCoutRevient(10000);
                            setEmballageExport(200);
                            setPreAcheminement(500);
                            setDouaneExport(150);
                            setMiseFob(300);
                            setFraisDocumentaires(0);
                            setIsBilledInBaseCurrency(true);
                            setFretPrincipal(1200);
                            setTauxAssurance(0.5);
                            setTauxChange(1);
                            setIsCurrencyConverted(false);
                            setDeviseArrivee('USD');
                            setBafRate(0);
                            setCafRate(0);
                            setCoeffMajorationAssurance(10);
                            setIsInsuranceCircular(true);
                            setPostAcheminement(400);
                            setDechargementDestination(100);
                            setDouaneImport(850);
                        }}
                        className="flex items-center px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:ring-offset-2"
                    >
                        <RotateCcw size={16} className="mr-2" /> {t('calculator.reset')}
                    </button>
                    <Link to="/" className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:ring-offset-2">
                        <ArrowLeft size={16} className="mr-2" /> {t('nav.dashboard')}
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* MOBILE TABS (sm and md only) */}
                <div className="flex lg:hidden bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-4">
                    <button
                        onClick={() => setActiveTab('saisie')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'saisie' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Saisie des Coûts
                    </button>
                    <button
                        onClick={() => setActiveTab('resultats')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'resultats' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        Résultats Cascade
                    </button>
                </div>

                {/* COLONNE GAUCHE : INPUTS */}
                <div className={`w-full lg:w-1/3 space-y-6 ${activeTab === 'saisie' ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 transition-colors">{t('calculator.base_params')}</h2>

                        {/* Toggle Mode */}
                        <div className="mb-6">
                            <Label className="mb-2 block">{t('calculator.mode_transport')}</Label>
                            <div className="flex rounded-md shadow-sm">
                                <button
                                    onClick={() => setMode('MULTIMODAL')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-l-md border transition-colors ${mode === 'MULTIMODAL' ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {t('calculator.mode_multimodal')}
                                </button>
                                <button
                                    onClick={() => setMode('MARITIME')}
                                    className={`flex-1 py-2 text-sm font-medium rounded-r-md border-t border-b border-r transition-colors ${mode === 'MARITIME' ? 'bg-cyan-700 dark:bg-cyan-600 text-white border-cyan-700 dark:border-cyan-600' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                >
                                    {t('calculator.mode_maritime')}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>{t('calculator.exw_cost')}</Label>
                                <div className="mt-1"><Input type="number" value={coutRevient} onChange={e => setCoutRevient(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.export_packaging')}</Label>
                                <div className="mt-1"><Input type="number" value={emballageExport} onChange={e => setEmballageExport(Number(e.target.value))} /></div>
                            </div>
                        </div>
                    </div>

                    <Accordion>
                        <AccordionItem title={t('calculator.advanced_params')}>
                            <div className="flex flex-col gap-5 pt-2">
                                <div className="flex flex-col w-full gap-3">
                                    <div className="flex flex-row items-center justify-between gap-3">
                                        <Label className="text-sm font-medium cursor-pointer" onClick={() => setIsCurrencyConverted(!isCurrencyConverted)}>{t('calculator.currency_conversion_toggle')}</Label>
                                        <Switch checked={isCurrencyConverted} onCheckedChange={setIsCurrencyConverted} />
                                    </div>
                                    <AnimatePresence>
                                        {isCurrencyConverted && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2 overflow-hidden">
                                                <Label className="text-sm font-medium">{t('calculator.exchange_rate')}</Label>
                                                <div className="flex flex-row w-full gap-2">
                                                    <div className="flex-[3] min-w-0">
                                                        <Input type="number" step="0.01" value={tauxChange} onChange={e => setTauxChange(Number(e.target.value))} />
                                                    </div>
                                                    <div className="flex-[2] min-w-0">
                                                        <Input type="text" value={deviseArrivee} onChange={e => setDeviseArrivee(e.target.value.toUpperCase())} className="uppercase px-1 text-center" placeholder="USD" maxLength={3} />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('calculator.exchange_rate_help')}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="border-t border-slate-200 dark:border-slate-700" />

                                <div className="flex flex-col w-full gap-3">
                                    <div className="flex flex-row items-center justify-between gap-3">
                                        <Label className="text-sm font-medium cursor-pointer" onClick={() => setIsInsuranceCircular(!isInsuranceCircular)}>{t('calculator.insurance_circular_toggle')}</Label>
                                        <Switch checked={isInsuranceCircular} onCheckedChange={setIsInsuranceCircular} />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label className="text-sm font-medium">{t('calculator.insurance_surcharge')}</Label>
                                        <div className="flex w-full items-stretch rounded-md border border-slate-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-slate-900 dark:focus-within:ring-slate-100 bg-white dark:bg-slate-800">
                                            <input
                                                type="number"
                                                step="1"
                                                value={coeffMajorationAssurance}
                                                onChange={e => setCoeffMajorationAssurance(Number(e.target.value))}
                                                className="flex-1 w-full min-w-0 h-10 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                                            />
                                            <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-700/50 px-3 border-l border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-500 dark:text-slate-400 shrink-0 select-none">
                                                %
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{t('calculator.insurance_surcharge_help')}</p>
                                    </div>
                                </div>
                            </div>
                        </AccordionItem>
                    </Accordion>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 pb-2 transition-colors">{t('calculator.logistics_departure')}</h2>
                        <div className="space-y-4">
                            <div>
                                <Label>{t('calculator.pre_carriage')}</Label>
                                <div className="mt-1"><Input type="number" value={preAcheminement} onChange={e => setPreAcheminement(Number(e.target.value))} /></div>
                            </div>
                            <div>
                                <Label>{t('calculator.export_customs')}</Label>
                                <div className="mt-1"><Input type="number" value={douaneExport} onChange={e => setDouaneExport(Number(e.target.value))} /></div>
                            </div>

                            <AnimatePresence>
                                {mode === 'MARITIME' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Label className="text-cyan-800 dark:text-cyan-400 cursor-help" title={t('calculator.departure_ancillary_help')}>{t('calculator.departure_ancillary')}</Label>
                                        <div className="mt-1"><Input type="number" value={miseFob} onChange={e => setMiseFob(Number(e.target.value))} className="border-cyan-300 focus:ring-cyan-500" /></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <Label>{t('calculator.main_freight')}</Label>
                                <div className="mt-1"><Input type="number" value={fretPrincipal} onChange={e => setFretPrincipal(Number(e.target.value))} /></div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('calculator.main_freight_help')}</p>
                            </div>

                            <AnimatePresence>
                                {mode === 'MARITIME' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="grid grid-cols-2 gap-4 mt-2 overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-cyan-800 dark:text-cyan-400">{t('calculator.baf')}</Label>
                                            <Input type="number" step="0.1" value={bafRate} onChange={e => setBafRate(Number(e.target.value))} className="border-cyan-300 focus:ring-cyan-500" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-cyan-800 dark:text-cyan-400">{t('calculator.caf')}</Label>
                                            <Input type="number" step="0.1" value={cafRate} onChange={e => setCafRate(Number(e.target.value))} className="border-cyan-300 focus:ring-cyan-500" />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <Label>{t('calculator.documentary_fees')}</Label>
                                    {isCurrencyConverted && (
                                        <button
                                            type="button"
                                            onClick={() => setIsBilledInBaseCurrency(!isBilledInBaseCurrency)}
                                            className={`text-xs font-medium px-2.5 py-1 rounded-md transition-colors cursor-pointer ${isBilledInBaseCurrency
                                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60'
                                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                                                }`}
                                        >
                                            {isBilledInBaseCurrency ? `Devise : EUR` : `Devise : ${deviseArrivee || 'USD'}`}
                                        </button>
                                    )}
                                </div>
                                <Input type="number" value={fraisDocumentaires} onChange={e => setFraisDocumentaires(Number(e.target.value))} />
                                {isCurrencyConverted && (
                                    <p className="text-xs italic text-slate-500 dark:text-slate-400">
                                        {isBilledInBaseCurrency
                                            ? t('calculator.doc_fees_will_convert')
                                            : t('calculator.doc_fees_already_target')
                                        }
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label>{t('calculator.insurance_rate')}</Label>
                                <div className="mt-1"><Input type="number" step="0.1" value={tauxAssurance} placeholder="Saisir en % (ex: 1 pour 1%)" onChange={e => setTauxAssurance(Number(e.target.value))} /></div>
                            </div>
                        </div>
                    </div>

                    <Accordion>
                        <AccordionItem title={t('calculator.destination_accordion')}>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <Label>{t('calculator.post_carriage')}</Label>
                                    <div className="mt-1"><Input type="number" value={postAcheminement} onChange={e => setPostAcheminement(Number(e.target.value))} /></div>
                                </div>
                                <div>
                                    <Label>{t('calculator.unloading')}</Label>
                                    <div className="mt-1"><Input type="number" value={dechargementDestination} onChange={e => setDechargementDestination(Number(e.target.value))} /></div>
                                </div>
                                <div>
                                    <Label>{t('calculator.import_customs')}</Label>
                                    <div className="mt-1"><Input type="number" value={douaneImport} onChange={e => setDouaneImport(Number(e.target.value))} /></div>
                                </div>
                            </div>
                        </AccordionItem>
                    </Accordion>

                </div>

                {/* COLONNE DROITE : CASCADE */}
                <div className={`w-full lg:w-2/3 ${activeTab === 'resultats' ? 'block' : 'hidden lg:block'}`}>
                    <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 sticky top-8 transition-colors">
                        <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-700 pb-2 transition-colors">{t('calculator.price_cascade')}</h2>

                        <div className="relative">
                            {/* Ligne visuelle connectant la cascade */}
                            <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-300 dark:bg-slate-700 z-0 hidden sm:block"></div>

                            <div className="relative z-10 flex flex-col gap-1 overflow-x-auto pb-4 sm:pb-0 custom-scrollbar-hide">
                                <AnimatePresence mode="popLayout">
                                    <Row key="EXW" label={`EXW${isCurrencyConverted ? '' : ' (€)'}`} value={cascade.exw} currency="EUR" />

                                    {cascade.fca > cascade.exw && (
                                        <Row key="FCA" label={`FCA${isCurrencyConverted ? '' : ' (€)'}`} value={cascade.fca} currency="EUR" />
                                    )}

                                    {mode === 'MARITIME' ? (
                                        <>
                                            {cascade.fob > cascade.fca && <Row key="FOB" label={`FOB${isCurrencyConverted ? '' : ' (€)'}`} value={cascade.fob} isMaritime currency="EUR" />}
                                            {isCurrencyConverted && cascade.baseConvertie > 0 && <Row key="FOBCONVERTI" label={`FOB Converti en ${deviseArrivee}`} value={cascade.baseConvertie} isMaritime note={`Taux de change appliqué : x ${tauxChange}`} currency={deviseArrivee} />}

                                            {cascade.cfr > (isCurrencyConverted ? cascade.baseConvertie : cascade.fob) &&
                                                <Row key="CFR" label="CFR" value={cascade.cfr} isMaritime
                                                    note={(bafRate > 0 || cafRate > 0) ? `Inclut BAF ${bafRate}% et CAF ${cafRate}%` : undefined}
                                                    currency={isCurrencyConverted ? deviseArrivee : 'EUR'}
                                                />
                                            }
                                            {cascade.cif > cascade.cfr && <Row key="CIF" label="CIF" value={cascade.cif} isCustoms isMaritime currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />}
                                        </>
                                    ) : (
                                        <>
                                            {isCurrencyConverted && cascade.baseConvertie > 0 && <Row key="FCACONVERTI" label={`FCA Converti en ${deviseArrivee}`} value={cascade.baseConvertie} note={`Taux de change appliqué : x ${tauxChange}`} currency={deviseArrivee} />}
                                            {cascade.cpt > (isCurrencyConverted ? cascade.baseConvertie : cascade.fca) && <Row key="CPT" label="CPT" value={cascade.cpt} currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />}
                                            {cascade.cip > cascade.cpt && <Row key="CIP" label="CIP" value={cascade.cip} isCustoms currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />}
                                        </>
                                    )}

                                    {cascade.dap > (mode === 'MARITIME' ? cascade.cif : cascade.cip) && (
                                        <Row key="DAP" label="DAP" value={cascade.dap} currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />
                                    )}

                                    {cascade.dpu > cascade.dap && (
                                        <Row key="DPU" label="DPU" value={cascade.dpu} currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />
                                    )}

                                    {cascade.ddp > cascade.dpu && (
                                        <Row key="DDP" label="DDP" value={cascade.ddp} currency={isCurrencyConverted ? deviseArrivee : 'EUR'} />
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};
