import type { RichText } from '../domain/types'

/**
 * Citation helpers for synthetic interpretations.
 * Links point at stable database / search pages — no invented PubMed IDs.
 */
const ACCESSED = '2026-11-02'

type Cite = { cite: { label: string; url: string; source: string; accessed: string; version?: string } }

const cite = (label: string, url: string, source: string, version?: string): Cite => ({
  cite: { label, url, source, accessed: ACCESSED, version },
})

export const oncokb = (gene: string, alteration: string) =>
  cite(
    `OncoKB: ${gene} ${alteration}`,
    `https://www.oncokb.org/gene/${gene}/${encodeURIComponent(alteration)}`,
    'OncoKB',
    'data release 2026-10',
  )

export const uniprot = (accession: string) =>
  cite(
    `UniProt: ${accession}`,
    `https://www.uniprot.org/uniprotkb/${accession}/entry`,
    'UniProtKB',
    '2026_04',
  )

export const cosmic = (gene: string) =>
  cite(`COSMIC: ${gene}`, `https://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=${gene}`, 'COSMIC', 'v101')

export const clinvar = (query: string) =>
  cite(
    `ClinVar: ${query}`,
    `https://www.ncbi.nlm.nih.gov/clinvar/?term=${encodeURIComponent(query)}`,
    'ClinVar',
    '2026-10 release',
  )

export const gnomad = (gene: string) =>
  cite(
    `gnomAD: ${gene}`,
    `https://gnomad.broadinstitute.org/gene/${gene}?dataset=gnomad_r4`,
    'gnomAD',
    'v4.1',
  )

export const vep = (transcript: string) =>
  cite(`VEP: ${transcript}`, `https://www.ensembl.org/Homo_sapiens/Tools/VEP`, 'Ensembl VEP', 'release 114')

export const pubmed = (query: string, label = `PubMed: ${query}`) =>
  cite(label, `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`, 'PubMed')

/** FLAURA phase III trial (Soria et al., N Engl J Med 2018). */
export const flaura = cite('PMID:29151359', 'https://pubmed.ncbi.nlm.nih.gov/29151359/', 'PubMed')

/** Tagged template that keeps citations inline: rt`text ${oncokb('EGFR','L858R')} more text`. */
export function rt(strings: TemplateStringsArray, ...cites: Cite[]): RichText {
  const out: RichText = []
  strings.forEach((s, i) => {
    if (s) out.push(s)
    if (cites[i]) out.push(cites[i])
  })
  return out
}
