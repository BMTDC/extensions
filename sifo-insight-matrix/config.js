'use strict';
const defaults={warningPct:90,goodPct:100,defaultTarget:100,numberDecimals:0};
const ids=Object.keys(defaults);const $=id=>document.getElementById(id);
function fill(values){ids.forEach(id=>$(id).value=values[id]??defaults[id])}
async function init(){await tableau.extensions.initializeDialogAsync();fill({...defaults,...tableau.extensions.settings.getAll()});$('form').addEventListener('submit',save);$('reset').addEventListener('click',()=>fill(defaults));$('cancel').addEventListener('click',()=>tableau.extensions.ui.closeDialog('cancel'))}
async function save(e){e.preventDefault();const values=Object.fromEntries(ids.map(id=>[id,Number($(id).value)]));if(!Number.isFinite(values.warningPct)||!Number.isFinite(values.goodPct)||values.warningPct<=0||values.goodPct<values.warningPct||values.defaultTarget<=0){$('message').textContent='Use positive values and keep the good threshold equal to or above the warning threshold.';return}ids.forEach(id=>tableau.extensions.settings.set(id,String(values[id])));await tableau.extensions.settings.saveAsync();tableau.extensions.ui.closeDialog('saved')}
document.addEventListener('DOMContentLoaded',()=>init().catch(e=>$('message').textContent=e.message));
