import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent }) => {
  const { programmes } = await parent();

  if (programmes.length > 0) {
    redirect(303, `/katalog/${programmes[0].code}`);
  }
};
