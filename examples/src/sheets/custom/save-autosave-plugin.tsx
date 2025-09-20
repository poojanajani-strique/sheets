/**
 * Autosave + Save button (replace/new) minimal plugin
 */
import type { Workbook } from '@univerjs/core';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ICommandService, Inject, Injector, IUniverInstanceService, Plugin, UniverInstanceType } from '@univerjs/core';
import { BuiltInUIPart, IUIPartsService, connectInjector, useDependency } from '@univerjs/ui';

function persistSnapshotLocal(key: string, snapshot: unknown) {
    try {
        localStorage.setItem(key, JSON.stringify(snapshot));
        return true;
    } catch {
        return false;
    }
}

function SaveBar() {
    const commandService = useDependency(ICommandService);
    const instanceService = useDependency(IUniverInstanceService);

    const [status, setStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
    const debounceTimer = useRef<number | null>(null);

    const save = useCallback((mode: 'replace' | 'new') => {
        try {
            const wb = instanceService.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
            if (!wb) return false;
            const snapshot = wb.save();
            const now = Date.now();
            const baseName = (snapshot.name && snapshot.name.trim().length > 0) ? snapshot.name : 'workbook';
            const key = mode === 'replace'
                ? `univer:autosave:${snapshot.id || baseName}`
                : `univer:saved:${now}:${baseName}`;
            const ok = persistSnapshotLocal(key, snapshot);
            setStatus(ok ? 'saved' : 'error');
            return ok;
        } catch {
            setStatus('error');
            return false;
        }
    }, [instanceService]);

    const scheduleAutosave = useCallback(() => {
        setStatus('syncing');
        if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
        debounceTimer.current = window.setTimeout(() => {
            save('replace');
        }, 2000);
    }, [save]);

    useEffect(() => {
        const d1 = commandService.onCommandExecuted(() => {
            scheduleAutosave();
        });
        return () => {
            d1.dispose();
            if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
        };
    }, [commandService, scheduleAutosave]);

    const label = useMemo(() => {
        switch (status) {
        case 'syncing': return 'Syncing…';
        case 'saved': return 'Saved';
        case 'error': return 'Save error';
        default: return '';
        }
    }, [status]);

    return (
        <div className="univer-flex univer-items-center univer-justify-between univer-border-b univer-border-gray-200 univer-bg-white dark:!univer-bg-gray-800 univer-px-3 univer-py-1">
            <div className="unver-text-xs univer-text-gray-500 dark:!univer-text-gray-300">{label}</div>
            <div className="univer-flex univer-gap-2">
                <button
                    className="univer-rounded univer-border univer-border-gray-300 univer-bg-white univer-px-2 univer-py-1 hover:univer-bg-gray-50 dark:!univer-bg-gray-700 dark:hover:!univer-bg-gray-600"
                    onClick={() => save('replace')}
                >Save</button>
                <button
                    className="univer-rounded univer-border univer-border-gray-300 univer-bg-white univer-px-2 univer-py-1 hover:univer-bg-gray-50 dark:!univer-bg-gray-700 dark:hover:!univer-bg-gray-600"
                    onClick={() => save('new')}
                >Save as new</button>
            </div>
        </div>
    );
}

export class SaveAutosavePlugin extends Plugin {
    static override type = UniverInstanceType.UNIVER_SHEET;
    static override pluginName = 'SAVE_AUTOSAVE_PLUGIN';

    constructor(
        _config = undefined,
        @Inject(Injector) private readonly _injector: Injector,
        @IUIPartsService private readonly _uiParts: IUIPartsService,
    ) {
        super();
    }

    override onStarting(): void {
        const Connected = () => connectInjector(SaveBar, this._injector);
        this.disposeWithMe(this._uiParts.registerComponent(BuiltInUIPart.CUSTOM_HEADER, Connected));
    }
}

export default SaveAutosavePlugin;


