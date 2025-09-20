/**
 * Import Excel (.xlsx) Plugin
 */
import type { IWorkbookData } from '@univerjs/core/src/sheets/typedef';
import type { Workbook, ICommand } from '@univerjs/core';
import { CommandType, Inject, Injector, LocaleType, Plugin, Tools, UniverInstanceType, ICommandService } from '@univerjs/core';
import { ComponentManager, IMenuManagerService, MenuItemType, RibbonStartGroup } from '@univerjs/ui';
import { FolderIcon } from '@univerjs/icons';
import * as XLSX from 'xlsx';

function waitUserSelectXlsxFile(onSelect: (wb: XLSX.WorkBook) => Promise<boolean> | boolean): Promise<boolean> {
    return new Promise(async (resolve) => {
        // Prefer the native file picker when available
        try {
            const showOpenFilePicker = (window as any).showOpenFilePicker as undefined | ((opts: any) => Promise<any[]>);
            if (showOpenFilePicker) {
                const [handle] = await showOpenFilePicker({
                    multiple: false,
                    types: [
                        {
                            description: 'Excel Workbook',
                            accept: {
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                            },
                        },
                    ],
                    excludeAcceptAllOption: false,
                });
                const file = await handle.getFile();
                const ab = await file.arrayBuffer();
                const wb = XLSX.read(ab, { type: 'array', cellDates: true });
                const ok = await onSelect(wb);
                return resolve(!!ok);
            }
        } catch (error) {
            // If showOpenFilePicker fails (permissions, unsupported path), fall back to input method
            console.warn('[ImportXlsxPlugin] showOpenFilePicker failed, falling back to input method', error);
        }

        const input = document.createElement('input');
        input.type = 'file';
        // Accept both extension and official MIME type for better cross-browser support
        input.accept = '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';

        // Keep the element in the DOM for Safari compatibility, but invisible/off-screen
        input.style.position = 'fixed';
        input.style.left = '-9999px';
        input.style.width = '0';
        input.style.height = '0';
        input.style.opacity = '0';

        const cleanup = () => {
            input.onchange = null;
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        };

        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) {
                cleanup();
                return resolve(false);
            }
            try {
                const ab = await file.arrayBuffer();
                const wb = XLSX.read(ab, { type: 'array', cellDates: true });
                const ok = await onSelect(wb);
                resolve(!!ok);
            } catch (error) {
                console.error('[ImportXlsxPlugin] Failed to read selected file', error);
                alert('Failed to read the selected Excel file. Please try again.');
                resolve(false);
            } finally {
                cleanup();
            }
        };

        document.body.appendChild(input);
        // Debug log to confirm click path reached
        // eslint-disable-next-line no-console
        console.debug('[ImportXlsxPlugin] Triggering hidden input click');
        input.click();
    });
}

function xlsxToUniverSnapshot(wb: XLSX.WorkBook, base?: IWorkbookData): IWorkbookData {
    const id = 'imported-' + Date.now();
    const locale: LocaleType = (base?.locale ?? LocaleType.EN_US) as LocaleType;
    const name = wb.Props?.Title || base?.name || '';
    const snapshot: IWorkbookData = {
        id,
        name,
        appVersion: base?.appVersion || 'local',
        locale,
        styles: {},
        sheetOrder: [],
        sheets: {},
        resources: [],
        custom: {},
    };

    const sheetNames = wb.SheetNames || [];
    sheetNames.forEach((sheetName, idx) => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;
        const ref = ws['!ref'] || 'A1';
        const range = XLSX.utils.decode_range(ref);
        const rows = Math.max( (range.e?.r ?? 0) + 1, 1);
        const cols = Math.max( (range.e?.c ?? 0) + 1, 1);

        const cellData: Record<number, Record<number, any>> = {};
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const addr = XLSX.utils.encode_cell({ r, c });
                const cell = (ws as any)[addr];
                if (!cell) continue;
                const out: any = {};
                if (cell.f) out.f = String(cell.f);
                if (cell.v !== undefined) out.v = cell.v;
                if (out.f !== undefined || out.v !== undefined) {
                    if (!cellData[r]) cellData[r] = {} as any;
                    cellData[r][c] = out;
                }
            }
        }

        // Ensure sheet IDs are globally unique across the Univer instance to avoid
        // UI key collisions and permission point duplication
        const sheetId = `${id}-sheet-${String(idx + 1).padStart(2, '0')}`;
        snapshot.sheetOrder.push(sheetId);
        snapshot.sheets[sheetId] = {
            id: sheetId,
            name: sheetName.substring(0, 31),
            rowCount: rows,
            columnCount: cols,
            cellData,
        } as any;
    });

    if (snapshot.sheetOrder.length === 0) {
        const sheetId = `${id}-sheet-01`;
        snapshot.sheetOrder.push(sheetId);
        snapshot.sheets[sheetId] = {
            id: sheetId,
            name: 'Sheet1',
            rowCount: 1,
            columnCount: 1,
            cellData: {},
        } as any;
    }

    return snapshot;
}

const IMPORT_XLSX_BUTTON_ID = 'import-xlsx-button';

class ImportXlsxPlugin extends Plugin {
    static override pluginName = 'import-xlsx-plugin';
    static override type = UniverInstanceType.UNIVER_SHEET;

    constructor(
        _config = undefined,
        @Inject(Injector) private readonly _injector: Injector,
        @Inject(IMenuManagerService) private readonly _menu: IMenuManagerService,
        @Inject(ComponentManager) private readonly _cmp: ComponentManager,
        @Inject(ICommandService) private readonly _command: ICommandService
    ) {
        super();
    }

    override onStarting(): void {
        this.disposeWithMe(this._cmp.register('FolderIcon3', FolderIcon));

        this._menu.mergeMenu({
            [RibbonStartGroup.OTHERS]: {
                [IMPORT_XLSX_BUTTON_ID]: {
                    order: 48,
                    menuItemFactory: () => ({
                        id: IMPORT_XLSX_BUTTON_ID,
                        title: 'Import Excel',
                        tooltip: 'Import .xlsx',
                        icon: 'FolderIcon3',
                        type: MenuItemType.BUTTON,
                    }),
                },
            },
        });

        // Register command to align with toolbar behavior
        const command: ICommand = {
            type: CommandType.OPERATION,
            id: IMPORT_XLSX_BUTTON_ID,
            handler: () => {
                // Trigger file picker synchronously within the command handler
                void waitUserSelectXlsxFile(async (wb) => {
                    try {
                        const univer = (window as any).univer as { __getInjector: () => Injector } | undefined;
                        const univerAPI = (window as any).univerAPI as { createWorkbook: (data: IWorkbookData, opt?: any) => void } | undefined;
                        const currentWb = (window as any).univerAPI?.getActiveWorkbook?.();
                        const baseSnap: IWorkbookData | undefined = currentWb?.save?.();
                        const snapshot = xlsxToUniverSnapshot(wb, baseSnap);

                        if (univerAPI?.createWorkbook) {
                            univerAPI.createWorkbook(snapshot, { makeCurrent: true });
                            return true;
                        }

                        const u = univer as unknown as { createUnit?: (type: UniverInstanceType, data: IWorkbookData) => void } | undefined;
                        if (u?.createUnit) {
                            u.createUnit(UniverInstanceType.UNIVER_SHEET, snapshot);
                            return true;
                        }

                        console.error('[ImportXlsxPlugin] Unable to create workbook: univerAPI and fallback createUnit are unavailable');
                        alert('Unable to create workbook in the current environment.');
                        return false;
                    } catch (error) {
                        console.error('[ImportXlsxPlugin] Failed to import Excel file', error);
                        alert('Failed to import the Excel file.');
                        return false;
                    }
                });

                return true;
            },
        };

        this._command.registerCommand(command);
    }
}

export default ImportXlsxPlugin;


