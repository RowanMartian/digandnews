export type NewsCategory = 'history' | 'archaeology' | 'paleontology';

export interface NewsItem {
  id: string;
  title: string;
  category: NewsCategory;
  date: string;
  excerpt: string;
  source: string;
  link?: string;
  /** When true, show "Article" tag and opening it shows full article view */
  isArticle?: boolean;
  /** Full article body (plain text); used when isArticle is true and we're not embedding the link */
  fullArticle?: string;
  /** Optional image URLs to show in the article body (for curated articles) */
  imageUrls?: string[];
}

export const defaultNews: NewsItem[] = [
  { id: 'n1', title: 'Medieval shipwreck reveals trade routes', category: 'history', date: '2025-02-08', excerpt: 'Baltic wreck from the 14th century sheds light on Hanseatic trade and shipbuilding.', source: 'Maritime History Review', isArticle: true, fullArticle: 'A well-preserved shipwreck in the Baltic Sea has been dated to the mid-14th century. The hull and cargo provide new evidence for Hanseatic trade routes and shipbuilding techniques of the period. Timber analysis and artefacts place the vessel in the network linking Lübeck, Tallinn, and Novgorod.\n\nExcavations have revealed a mixed cargo including amber, timber, and metal goods. The find will be documented and conserved in situ with plans for a future museum display.' },
  { id: 'n2', title: 'Roman villa mosaic restored in Britain', category: 'archaeology', date: '2025-02-07', excerpt: 'Large geometric and figurative mosaic at a villa site in Gloucestershire is now on display.', source: 'Britannia', isArticle: true, fullArticle: 'The large polychrome mosaic from the Roman villa at Woodchester has been fully restored and is now on view to the public. The mosaic depicts Orpheus surrounded by animals and geometric borders.\n\nConservation work took three years and involved stabilising the tesserae and repairing damage from earlier excavations. The site is part of a broader Romano-British landscape being studied by the local trust.', imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Orpheus_mosaic_%28Gloucestershire%29.jpg/800px-Orpheus_mosaic_%28Gloucestershire%29.jpg'] },
  { id: 'n3', title: 'New theropod from Brazil challenges phylogeny', category: 'paleontology', date: '2025-02-06', excerpt: 'Fossil from the Cretaceous of Brazil suggests earlier divergence of certain lineages.', source: 'Journal of Vertebrate Paleontology' },
  { id: 'n4', title: 'Ice Age art in Indonesian cave dated', category: 'archaeology', date: '2025-02-05', excerpt: 'New dating of rock art in Sulawesi pushes back evidence for symbolic behaviour.', source: 'Nature', isArticle: true, fullArticle: 'U-series dating of speleothem overlying rock art in Sulawesi has yielded minimum ages of over 40,000 years for hand stencils and a figurative animal painting. This places the art among the oldest known in the world and reinforces the view that symbolic behaviour was widespread by the Late Pleistocene.\n\nThe findings are consistent with similar early dates from Borneo and Spain, suggesting that cave art was not unique to Europe.' },
  { id: 'n5', title: 'Stegosaurus plate function revisited', category: 'paleontology', date: '2025-02-04', excerpt: 'Biomechanical and vascular studies support thermoregulation and display roles.', source: 'Paleobiology' },
  { id: 'n6', title: 'Byzantine harbour discovered in Istanbul', category: 'history', date: '2025-02-03', excerpt: 'Construction work uncovers remains of the Theodosian harbour and ships.', source: 'Archaeology Today' },
  { id: 'n7', title: 'Neanderthal glue recipe reconstructed', category: 'archaeology', date: '2025-02-02', excerpt: 'Experimental archaeology replicates birch tar production with Middle Palaeolithic methods.', source: 'Science Advances', isArticle: true, fullArticle: 'Researchers have reproduced birch bark tar using only materials and techniques available to Neanderthals. The process involves burning bark in an oxygen-free environment and can be achieved with a simple pit structure.\n\nThe study supports the view that Neanderthals had the capacity for complex adhesive production and planning. Replication of Middle Palaeolithic technology continues to revise our understanding of their capabilities.' },
  { id: 'n8', title: 'Sauropod neck posture and feeding', category: 'paleontology', date: '2025-02-01', excerpt: 'Digital models suggest varied neck postures for browsing at different heights.', source: 'PeerJ' },
  { id: 'n9', title: 'Viking Age settlement in Newfoundland', category: 'history', date: '2025-01-30', excerpt: 'L\'Anse aux Meadows and new finds extend the evidence for Norse presence.', source: 'Journal of the North Atlantic' },
  { id: 'n10', title: 'Egyptian mummy DNA and kinship', category: 'archaeology', date: '2025-01-28', excerpt: 'Genomic study of New Kingdom mummies reveals familial relationships and ancestry.', source: 'Nature Communications' },
  { id: 'n11', title: 'Feathered dinosaur from Japan', category: 'paleontology', date: '2025-01-25', excerpt: 'New small theropod with preserved feathers from the Early Cretaceous.', source: 'Communications Biology' },
  { id: 'n12', title: 'Industrial Revolution archaeology in Manchester', category: 'history', date: '2025-01-22', excerpt: 'Excavations at a mill site reveal workers\' housing and material culture.', source: 'Industrial Archaeology Review' },
];
