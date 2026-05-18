<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<div class="max-w-4xl space-y-8">
  <div>
    <h2 class="text-2xl font-semibold tracking-tight text-foreground">
      {data.programme.name}
    </h2>
    <p class="mt-1 text-sm text-foreground-alt">
      {data.programme.code}
      {#if data.programme.semester_count}
        &middot; {data.programme.semester_count} semestrów
      {/if}
    </p>
  </div>

  {#each data.semesters as semester (semester.number)}
    <section>
      <h3
        class="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-alt"
      >
        Semestr {semester.number}
      </h3>

      <div
        class="overflow-hidden rounded-lg border border-border-card shadow-card"
      >
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-card bg-muted/50">
              <th class="px-4 py-2 text-left font-medium text-foreground-alt">
                Przedmiot
              </th>
              <th class="px-4 py-2 text-left font-medium text-foreground-alt">
                Kod
              </th>
              <th class="px-4 py-2 text-left font-medium text-foreground-alt">
                Rodzaj
              </th>
              <th class="px-4 py-2 text-right font-medium text-foreground-alt">
                Godziny
              </th>
            </tr>
          </thead>
          <tbody>
            {#each semester.subjects as subject (subject.id)}
              {#if subject.activities.length > 0}
                {#each subject.activities as activity, i}
                  <tr class="border-b border-border-card last:border-b-0">
                    {#if i === 0}
                      <td
                        class="px-4 py-2.5 font-medium text-foreground align-top"
                        rowspan={subject.activities.length}
                      >
                        {subject.module_name}
                      </td>
                      <td
                        class="px-4 py-2.5 text-foreground-alt align-top"
                        rowspan={subject.activities.length}
                      >
                        {subject.module_code ?? "—"}
                      </td>
                    {/if}
                    <td class="px-4 py-2.5 text-foreground-alt">
                      {activity.kind}
                    </td>
                    <td
                      class="px-4 py-2.5 text-right tabular-nums text-foreground-alt"
                    >
                      {activity.hours}h
                    </td>
                  </tr>
                {/each}
              {:else}
                <tr class="border-b border-border-card last:border-b-0">
                  <td class="px-4 py-2.5 font-medium text-foreground">
                    {subject.module_name}
                  </td>
                  <td class="px-4 py-2.5 text-foreground-alt">
                    {subject.module_code ?? "—"}
                  </td>
                  <td class="px-4 py-2.5 text-foreground-alt" colspan={2}>
                    —
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/each}

  {#if data.semesters.length === 0}
    <p class="text-sm text-foreground-alt">Brak przedmiotów w tym programie.</p>
  {/if}
</div>
