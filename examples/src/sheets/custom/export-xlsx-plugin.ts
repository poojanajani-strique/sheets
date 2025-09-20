/**
 * Copyright 2023-present DreamNum Co., Ltd.
 * Licensed under the Apache License, Version 2.0
 */

import type { Workbook } from '@univerjs/core';
import { ICommandService, Inject, Injector, IUniverInstanceService, Plugin, UniverInstanceType } from '@univerjs/core';
import { ComponentManager, IMenuManagerService, IShortcutService, MenuItemType, RibbonStartGroup } from '@univerjs/ui';
import { FolderIcon } from '@univerjs/icons';
import * as XLSX from 'xlsx';

const EXPORT_XLSX_COMMAND_ID = 'export-xlsx-command';
const EXPORT_XLSX_SHORTCUT_ID = 'export-xlsx-shortcut';

export class ExportXlsxPlugin extends Plugin {
    static override type = UniverInstanceType.UNIVER_SHEET;
    static override pluginName = 'EXPORT_XLSX_PLUGIN';

    constructor(
        _config = undefined,
        @Inject(Injector) private readonly _injector: Injector,
        @IMenuManagerService private readonly _menu: IMenuManagerService,
        @ICommandService private readonly _commands: ICommandService,
        @IShortcutService private readonly _shortcuts: IShortcutService,
        @Inject(ComponentManager) private readonly _cmp: ComponentManager
    ) {
        super();
    }

    override onStarting() {
        this.disposeWithMe(this._cmp.register('FolderIcon2', FolderIcon));

        this.disposeWithMe(this._commands.registerCommand({
            id: EXPORT_XLSX_COMMAND_ID,
            type: 1,
            handler: () => this._handleExport(),
        }));

        this.disposeWithMe(this._shortcuts.registerShortcut({
            id: EXPORT_XLSX_SHORTCUT_ID,
            desc: 'Export as Excel',
            group: 'General',
            shortcuts: [
                { metaKey: true, shiftKey: true, keycode: 'S' },
                { ctrlKey: true, shiftKey: true, keycode: 'S' },
            ],
            preconditions: [],
            action: () => this._commands.executeCommand(EXPORT_XLSX_COMMAND_ID),
        }));

        const menuItemFactory = () => ({
            id: EXPORT_XLSX_COMMAND_ID,
            title: 'Save as Excel',
            tooltip: 'Export current workbook to .xlsx',
            icon: 'FolderIcon2',
            type: MenuItemType.BUTTON,
        });

        this._menu.mergeMenu({
            [RibbonStartGroup.OTHERS]: {
                [EXPORT_XLSX_COMMAND_ID]: { order: 50, menuItemFactory },
            },
        });
    }

    private _handleExport(): boolean {
        const univerInstances = this._injector.get(IUniverInstanceService);
        const workbook = univerInstances.getCurrentUnitOfType<Workbook>(UniverInstanceType.UNIVER_SHEET);
        if (!workbook) return false;

        // Prefer facade API save() to include plugin resources when relevant
        const snapshot = workbook.save();

        const wb = XLSX.utils.book_new();
        const nowName = snapshot.name && snapshot.name.trim().length > 0 ? snapshot.name : undefined;

        for (const sheetId of snapshot.sheetOrder) {
            const sheet = snapshot.sheets[sheetId];
            if (!sheet) continue;

            // compute used range from sparse cellData
            const cellData = sheet.cellData || {} as Record<number, Record<number, any>>;
            let maxR = -1; let maxC = -1;
            for (const rStr in cellData) {
                const r = Number(rStr);
                const rowObj = cellData[rStr] || {};
                for (const cStr in rowObj) {
                    const c = Number(cStr);
                    if (r > maxR) maxR = r;
                    if (c > maxC) maxC = c;
                }
            }

            const rows = Math.max(maxR + 1, 0);
            const cols = Math.max(maxC + 1, 0);

            const data: any[][] = [];
            for (let r = 0; r < rows; r++) {
                const rowArr: any[] = [];
                const rowObj = cellData[r] || {};
                for (let c = 0; c < cols; c++) {
                    const cell = rowObj[c];
                    if (cell?.f) {
                        rowArr[c] = { f: String(cell.f), v: cell.v ?? undefined };
                    } else if (cell?.v !== undefined) {
                        rowArr[c] = cell.v;
                    } else {
                        rowArr[c] = undefined;
                    }
                }
                data.push(rowArr);
            }

            const ws = XLSX.utils.aoa_to_sheet(data);
            // Basic style mapping (very limited): map style id to bold/italic/underline if present (omitted here for brevity)
            const sheetName = (sheet as any).name || sheetId;
            XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
        }

        const filename = `${nowName ?? 'workbook_' + Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        return true;
    }
}

export default ExportXlsxPlugin;


