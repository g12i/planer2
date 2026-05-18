import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";
import { scrapedSubjectSchema } from "$lib/server/catalog-schemas";
import type { ScrapedSubject } from "$lib/server/catalog-types";
import type { SubjectActivity } from "$lib/server/planner-types";

/** Allowed path segment for `/programmes/list/all/{area}/…` (no traversal). */
const LISTING_AREA_RE = /^[A-Z0-9]{2,8}$/;

export function isValidCatalogListingArea(
	raw: string | undefined | null,
): raw is string {
	if (!raw || typeof raw !== "string") {
		return false;
	}
	return LISTING_AREA_RE.test(raw.trim());
}

export function normalizeCatalogListingArea(raw: string): string {
	return raw.trim().toUpperCase();
}

export function inferListingAreaFromProgrammeCode(
	programmeCode: string,
): string | null {
	const trimmed = programmeCode.trim();
	const match = /([A-Z]{2})\d{2}\.\d{4}$/.exec(trimmed);
	if (!match) {
		return null;
	}
	const area = match[1];
	return isValidCatalogListingArea(area) ? area : null;
}

export const DEFAULT_LISTING_AREA = "KO" as const;

export function resolveListingAreaForFetch(
	programmeCode: string,
	listingArea: string | undefined,
): string {
	if (isValidCatalogListingArea(listingArea)) {
		return normalizeCatalogListingArea(listingArea);
	}
	const inferred = inferListingAreaFromProgrammeCode(programmeCode);
	if (inferred) {
		return inferred;
	}
	return DEFAULT_LISTING_AREA;
}

export const CATALOG_SOURCE_ORIGIN = "https://informator.us.edu.pl" as const;

export const MAIN_LIST_ANCHORS = '[role="main"] ul li a[href]';

const RE_ALL_LISTING = /^\/programmes\/list\/all\/([^/?#]+)\/?(?:\?.*)?$/i;
const RE_AREA_PROGRAMME =
	/^\/programmes\/list\/all\/[^/]+\/([^/?#]+)\/?(?:\?.*)?$/i;

export type CatalogProgrammeAreaRow = {
	code: string;
	label: string;
};

export type CatalogNiestacjonarneRow = {
	programmeCode: string;
	label: string;
};

type ParsedModuleRow = {
	moduleId: string;
	moduleCode: string;
	moduleName: string;
	activities: SubjectActivity[];
};

function pathnameFromHref(href: string | undefined, baseUrl: string): string {
	if (!href) {
		return "";
	}
	const trimmed = href.trim();
	if (
		trimmed.startsWith("javascript:") ||
		trimmed.startsWith("#") ||
		trimmed.toLowerCase().startsWith("mailto:")
	) {
		return "";
	}
	try {
		return new URL(trimmed, baseUrl).pathname;
	} catch {
		return "";
	}
}

export function parseProgrammeAreasFromCheerio(
	$: CheerioAPI,
	baseUrl: string,
): CatalogProgrammeAreaRow[] {
	const byCode = new Map<string, string>();
	for (const element of $(MAIN_LIST_ANCHORS).toArray()) {
		const raw = $(element).attr("href");
		const path = pathnameFromHref(raw, baseUrl);
		const match = RE_ALL_LISTING.exec(path);
		if (!match) {
			continue;
		}
		const code = match[1]?.trim();
		if (!code || code.toLowerCase() === "all") {
			continue;
		}
		const upper = code.toUpperCase();
		if (!isValidCatalogListingArea(upper)) {
			continue;
		}
		const label = $(element).text().replace(/\s+/g, " ").trim();
		if (!label) {
			continue;
		}
		const previous = byCode.get(upper);
		if (!previous || label.length > previous.length) {
			byCode.set(upper, label);
		}
	}
	return [...byCode.entries()]
		.map(([code, label]) => ({ code, label }))
		.sort((a, b) =>
			a.label.localeCompare(b.label, "pl", { sensitivity: "base" }),
		);
}

export function parseNiestacjonarneFromCheerio(
	$: CheerioAPI,
	listingArea: string,
	baseUrl: string,
): CatalogNiestacjonarneRow[] {
	const area = normalizeCatalogListingArea(listingArea);
	const areaPath = `/programmes/list/all/${area}/`.toLowerCase();
	const rows: CatalogNiestacjonarneRow[] = [];
	const seen = new Set<string>();

	for (const element of $(MAIN_LIST_ANCHORS).toArray()) {
		const path = pathnameFromHref($(element).attr("href"), baseUrl);
		if (!path.toLowerCase().startsWith(areaPath)) {
			continue;
		}
		const match = RE_AREA_PROGRAMME.exec(path);
		if (!match) {
			continue;
		}
		const programmeCode = match[1]?.trim();
		if (!programmeCode || programmeCode.toLowerCase() === area.toLowerCase()) {
			continue;
		}
		const label = $(element).text().replace(/\s+/g, " ").trim();
		if (!/niestacjonarne/i.test(label)) {
			continue;
		}
		if (seen.has(programmeCode)) {
			continue;
		}
		seen.add(programmeCode);
		rows.push({ programmeCode, label });
	}

	rows.sort((a, b) =>
		a.label.localeCompare(b.label, "pl", { sensitivity: "base" }),
	);
	return rows;
}

const PROGRAMME_CODE_YEAR_RE = /^(.+)\.(\d{4})$/;

function programmeCodeYear(programmeCode: string): number | null {
	const match = PROGRAMME_CODE_YEAR_RE.exec(programmeCode.trim());
	if (!match) {
		return null;
	}
	const year = Number.parseInt(match[2], 10);
	return Number.isNaN(year) ? null : year;
}

/**
 * One niestacjonarne variant per area page (e.g. pierwszego vs drugiego stopnia).
 * Informator lists multiple code families (W5-…, 07-…) for the same label — keep
 * the row with the highest trailing year in programmeCode.
 */
export function pickLatestNiestacjonarneByYear(
	rows: CatalogNiestacjonarneRow[],
): CatalogNiestacjonarneRow[] {
	const byLabel = new Map<string, CatalogNiestacjonarneRow>();

	for (const row of rows) {
		const key = row.label.trim().toLowerCase();
		const year = programmeCodeYear(row.programmeCode);
		const existing = byLabel.get(key);

		if (!existing) {
			byLabel.set(key, row);
			continue;
		}

		const existingYear = programmeCodeYear(existing.programmeCode);
		if (year !== null && (existingYear === null || year > existingYear)) {
			byLabel.set(key, row);
		}
	}

	return [...byLabel.values()].sort((a, b) =>
		a.label.localeCompare(b.label, "pl", { sensitivity: "base" }),
	);
}

export function parseSemesterCount($: CheerioAPI): number | null {
	let count: number | null = null;

	$("[role='main'] table tr").each((_, row) => {
		const cells = $(row).find("th, td");
		if (cells.length < 2) {
			return;
		}
		const label = $(cells[0]).text().trim();
		if (!label.includes("Liczba semestrów")) {
			return;
		}
		const value = Number.parseInt($(cells[1]).text().trim(), 10);
		if (!Number.isNaN(value)) {
			count = value;
		}
	});

	return count;
}

function semesterPanelName(programmeCode: string, semester: number): string {
	return `tabPlan${semester}Sem${programmeCode}`;
}

function hourCellLines(html: string): string[] {
	return html
		.split(/<br\s*\/?>/gi)
		.map((chunk) =>
			chunk
				.replace(/<[^>]+>/g, " ")
				.replace(/\s+/g, " ")
				.trim(),
		)
		.filter(Boolean);
}

const HOUR_LINE_RE = /^(.+?):\s*(\d+)\s*$/;

function parseHourPairsFromHtml(
	html: string,
): { kind: string; hours: number }[] {
	const pairs: { kind: string; hours: number }[] = [];
	for (const line of hourCellLines(html)) {
		const match = HOUR_LINE_RE.exec(line);
		if (!match) {
			continue;
		}
		const kind = match[1].trim();
		const hours = Number.parseInt(match[2], 10);
		if (!kind || !Number.isFinite(hours) || hours <= 0) {
			continue;
		}
		pairs.push({ kind, hours });
	}
	return pairs;
}

function allowedAreaGroupIndices(semester: number): Set<number> {
	return new Set([semester - 1, semester].filter((index) => index >= 1));
}

const RE_SECTION_MAJOR = /moduły\s+kierunkowe/i;
const RE_SECTION_AREA =
	/moduły\s+obszarowe\s+wspierające\s+kształcenie\s+kierunkowe/i;
const RE_SECTION_GENERAL = /moduły\s+ogólnodostępne/i;
const RE_AREA_GROUP_ROW =
	/grupa\s+modułów\s+obszarowych\s+wspierających\s+kształcenie\s+kierunkowe\s+(\d+)/i;

function findOrCreateModuleRow(
	rows: ParsedModuleRow[],
	moduleId: string,
	moduleCode: string,
	moduleName: string,
): ParsedModuleRow {
	const existing = rows.find((row) => row.moduleId === moduleId);
	if (existing) {
		return existing;
	}
	const created: ParsedModuleRow = {
		moduleId,
		moduleCode,
		moduleName,
		activities: [],
	};
	rows.push(created);
	return created;
}

function appendHourPairs(
	row: ParsedModuleRow,
	pairs: { kind: string; hours: number }[],
): void {
	for (const { kind, hours } of pairs) {
		row.activities.push({ kind, hours });
	}
}

function pushActivitiesFromPlanLink(
	$: CheerioAPI,
	anchor: Cheerio<AnyNode>,
	rows: ParsedModuleRow[],
): void {
	const hrefAttr = anchor.attr("href")?.trim() ?? "";
	const match = /^\/modules\/(\d+)\/?/.exec(hrefAttr);
	if (!match) {
		return;
	}
	const moduleId = match[1];

	const moduleName = anchor.text().replace(/\s+/g, " ").trim();
	const rawCode = anchor.next("span.info-grey").text().trim();
	const moduleCode = rawCode ? rawCode.replace(/^\[|\]$/g, "") : moduleId;
	if (!moduleName) {
		return;
	}

	const tableRow = anchor.closest("tr");
	if (!tableRow.length) {
		return;
	}
	const cells = tableRow.find("> td");
	const hoursCell = cells.get(3);
	if (!hoursCell) {
		return;
	}

	const pairs = parseHourPairsFromHtml($(hoursCell).html() ?? "");
	if (pairs.length === 0) {
		return;
	}

	const row = findOrCreateModuleRow(rows, moduleId, moduleCode, moduleName);
	appendHourPairs(row, pairs);
}

function pushSyntheticAreaGroupRow(
	programmeCode: string,
	semester: number,
	groupIndex: number,
	title: string,
	pairs: { kind: string; hours: number }[],
	rows: ParsedModuleRow[],
): void {
	const moduleId =
		`area-group-${programmeCode}-S${semester}-G${groupIndex}`.replace(
			/[^a-zA-Z0-9-]/g,
			"-",
		);
	const row = findOrCreateModuleRow(rows, moduleId, moduleId, title);
	appendHourPairs(row, pairs);
}

function extractParsedModuleRowsForSemester(
	$: CheerioAPI,
	_listingArea: string,
	programmeCode: string,
	semester: number,
): ParsedModuleRow[] {
	const panelName = semesterPanelName(programmeCode, semester);
	const container = $("div.kk-tabcontent").filter(
		(_, element) => $(element).attr("name") === panelName,
	);
	if (!container.length) {
		return [];
	}

	const rows: ParsedModuleRow[] = [];
	const allowedAreaGroups = allowedAreaGroupIndices(semester);

	type PlanSection = "neutral" | "major" | "area" | "general";
	let section: PlanSection = "neutral";

	for (const rowElement of container.find("tr").toArray()) {
		const row = $(rowElement);
		const cells = row.find("> td");
		if (!cells.length) {
			continue;
		}
		const firstText = cells.first().text().replace(/\s+/g, " ").trim();

		if (RE_SECTION_MAJOR.test(firstText) && !/obszarowe/i.test(firstText)) {
			section = "major";
			continue;
		}
		if (RE_SECTION_AREA.test(firstText)) {
			section = "area";
			continue;
		}
		if (RE_SECTION_GENERAL.test(firstText)) {
			section = "general";
			continue;
		}

		const link = cells
			.first()
			.find('a[name="tab_plan_link"][href^="/modules/"]')
			.first();
		if (link.length) {
			if (section === "area") {
				continue;
			}
			pushActivitiesFromPlanLink($, link, rows);
			continue;
		}

		if (section === "area") {
			const groupMatch = RE_AREA_GROUP_ROW.exec(firstText);
			if (!groupMatch) {
				continue;
			}
			const groupNumber = Number.parseInt(groupMatch[1], 10);
			if (
				!Number.isFinite(groupNumber) ||
				!allowedAreaGroups.has(groupNumber)
			) {
				continue;
			}
			const hoursCell = cells.get(3);
			if (!hoursCell) {
				continue;
			}
			const pairs = parseHourPairsFromHtml($(hoursCell).html() ?? "");
			if (pairs.length === 0) {
				continue;
			}
			const title = `Grupa modułów obszarowych wspierających kształcenie kierunkowe ${groupNumber}`;
			pushSyntheticAreaGroupRow(
				programmeCode,
				semester,
				groupNumber,
				title,
				pairs,
				rows,
			);
		}
	}

	return rows;
}

export function extractSubjectsForSemester(
	$: CheerioAPI,
	listingArea: string,
	programmeCode: string,
	semester: number,
): ScrapedSubject[] {
	const moduleRows = extractParsedModuleRowsForSemester(
		$,
		listingArea,
		programmeCode,
		semester,
	);
	const subjects: ScrapedSubject[] = [];

	for (const row of moduleRows) {
		const parsed = scrapedSubjectSchema.safeParse({
			semesterNumber: semester,
			moduleCode: row.moduleCode,
			moduleName: row.moduleName,
			catalogId: row.moduleId,
			activities: row.activities,
		});
		if (parsed.success) {
			subjects.push(parsed.data);
		} else {
			console.warn(
				`[catalog-parse] skip ${row.moduleCode} sem ${semester}: ${parsed.error.message}`,
			);
		}
	}

	return subjects;
}
