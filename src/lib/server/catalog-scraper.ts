import * as cheerio from "cheerio";
import {
	CATALOG_SOURCE_ORIGIN,
	extractSubjectsForSemester,
	parseNiestacjonarneFromCheerio,
	parseProgrammeAreasFromCheerio,
	parseSemesterCount,
	pickLatestNiestacjonarneByYear,
} from "$lib/server/catalog-parse";
import { scrapedProgrammeBundleSchema } from "$lib/server/catalog-schemas";
import type { ScrapedProgrammeBundle } from "$lib/server/catalog-types";

const LIST_ALL_URL = `${CATALOG_SOURCE_ORIGIN}/programmes/list/all/`;
const FETCH_DELAY_MS = 200;
const USER_AGENT = "planer2-catalog-sync/1.0 (+https://github.com/planer2)";

async function delay(ms: number): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
	const response = await fetch(url, {
		headers: { "User-Agent": USER_AGENT },
	});

	if (!response.ok) {
		throw new Error(`HTTP ${response.status} for ${url}`);
	}

	return response.text();
}

async function fetchHtmlOrNull(url: string): Promise<string | null> {
	try {
		return await fetchHtml(url);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown fetch error";
		console.warn(`[catalog-scraper] fetch failed: ${message}`);
		return null;
	}
}

function recordScrapeError(
	scrapeErrors: string[],
	programmeCode: string,
	message: string,
): void {
	scrapeErrors.push(`${programmeCode}: ${message}`);
	console.warn(`[catalog-scraper] skip ${programmeCode}: ${message}`);
}

export async function* scrapeCatalogBundles(
	scrapeErrors: string[] = [],
): AsyncGenerator<ScrapedProgrammeBundle> {
	const listHtml = await fetchHtml(LIST_ALL_URL);
	await delay(FETCH_DELAY_MS);

	const $list = cheerio.load(listHtml);
	const areas = parseProgrammeAreasFromCheerio($list, LIST_ALL_URL);

	console.log(`[catalog-scraper] ${areas.length} listing areas`);

	for (const area of areas) {
		const areaUrl = `${CATALOG_SOURCE_ORIGIN}/programmes/list/all/${area.code}/`;
		const areaHtml = await fetchHtmlOrNull(areaUrl);
		await delay(FETCH_DELAY_MS);
		if (!areaHtml) {
			recordScrapeError(scrapeErrors, area.code, `failed to load area ${areaUrl}`);
			continue;
		}

		const $area = cheerio.load(areaHtml);
		const niestProgrammes = pickLatestNiestacjonarneByYear(
			parseNiestacjonarneFromCheerio($area, area.code, areaUrl),
		);

		for (const niest of niestProgrammes) {
			const programmeName = `${area.label}, ${niest.label}`;
			const versionUrl = `${CATALOG_SOURCE_ORIGIN}/programmes/list/all/${area.code}/${encodeURIComponent(niest.programmeCode)}/`;

			try {
				const versionHtml = await fetchHtmlOrNull(versionUrl);
				await delay(FETCH_DELAY_MS);
				if (!versionHtml) {
					throw new Error(`failed to load programme ${versionUrl}`);
				}

				const $version = cheerio.load(versionHtml);
				const semesterCount = parseSemesterCount($version);
				if (!semesterCount || semesterCount < 1) {
					throw new Error("missing semester count");
				}

				const subjects = [];
				for (let semester = 1; semester <= semesterCount; semester += 1) {
					subjects.push(
						...extractSubjectsForSemester(
							$version,
							area.code,
							niest.programmeCode,
							semester,
						),
					);
				}

				const bundle = scrapedProgrammeBundleSchema.safeParse({
					programme: {
						code: niest.programmeCode,
						name: programmeName,
						shortCode: area.code,
						semesterCount,
					},
					subjects,
				});

				if (!bundle.success) {
					throw new Error(bundle.error.message);
				}

				console.log(
					`[catalog-scraper] ${niest.programmeCode}: ${subjects.length} subjects`,
				);
				yield bundle.data;
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown programme scrape error";
				recordScrapeError(scrapeErrors, niest.programmeCode, message);
			}
		}
	}
}
