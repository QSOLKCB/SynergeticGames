// SPDX-License-Identifier: Apache-2.0
// Reviewed source configuration: fork authors may edit these plain text values.
export const museumConfig=Object.freeze({title:'The Living Museum',brand:'QSOL–IMC',description:'Explore, predict and discover.',edition:'SynergeticGames'});
export function applyMuseumIdentity(doc,config=museumConfig){
  doc.title=config.title+' — '+config.edition;
  for(const node of doc.querySelectorAll('[data-museum-title]'))node.textContent=config.title;
  for(const node of doc.querySelectorAll('[data-museum-brand]'))node.textContent=config.brand;
  for(const node of doc.querySelectorAll('[data-museum-description]'))node.textContent=config.description;
}
