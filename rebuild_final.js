const fs = require('fs');
const { execSync } = require('child_process');

const js = fs.readFileSync('C:/Users/Administrator/promo-site/rebuilt_check.js', 'utf-8');

// Strategy: remove advTX body, parse function body by body using simple approach
// Extract everything before advTX and everything after loadAllData
const advStart = js.indexOf('function advTX(');
let depth = 0, advEnd = advStart;
for (let i = advStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { advEnd = i + 1; break; } }
}

const loadStart = js.indexOf('async function loadAllData');
depth = 0;
let loadEnd = loadStart;
for (let i = loadStart; i < js.length; i++) {
    if (js[i] === '{') depth++;
    if (js[i] === '}') { depth--; if (depth === 0) { loadEnd = i + 1; break; } }
}

const before = js.substring(0, advStart);
const bodyContent = js.substring(advStart + 38, advEnd - 1); // raw body
const loadFunc = js.substring(loadStart, loadEnd);
const after = js.substring(loadEnd);

// Write a SIMPLE advTX replacement that does the same thing
// Use a completely flat structure - no nested complexities
const newAdv = `
function advTX(ap,curCPA,dInq,pjDaily){
  var db = AB.dailyBudget;
  var tCPA = AB.targetCPA;
  var tCV = AB.targetConversions;
  var html = '<div class="rl">';

  if (!ap.length) {
    html += '<div class="es"><p>暂无活跃项目</p></div></div>';
    return html;
  }

  var rk = ap.filter(function(p){return p.cpa>0;}).sort(function(a,b){
    var sa = (a.iqk*0.3)+(a.isSearch?30:0)+(Math.min((a.ord||0)/5,1)*20)+(20/(a.cpa/(tCPA||25)||1))+(Math.min((a.dc||0)/30,1)*10);
    var sb = (b.iqk*0.3)+(b.isSearch?30:0)+(Math.min((b.ord||0)/5,1)*20)+(20/(b.cpa/(tCPA||25)||1))+(Math.min((b.dc||0)/30,1)*10);
    return sb-sa;
  });

  if (!rk.length) {
    html += '<div class="es"><p>项目均无转化数据，请补充数据后再分析</p></div></div>';
    return html;
  }

  var top3 = rk.slice(0,3);
  var bot3 = rk.filter(function(p){return p.cpa>tCPA*1.3||(p.ord||0)===0;}).slice(0,3);

  var searchCPA = 0, searchCv = 0, searchInq = 0, recCPA = 0, recCv = 0, recInq = 0;
  ap.forEach(function(p){
    if (p.isSearch) {
      if (p.cpa>0) { searchCPA += p.cpa; searchCv++; }
      searchInq += p.iqk;
    } else {
      if (p.cpa>0) { recCPA += p.cpa; recCv++; }
      recInq += p.iqk;
    }
  });

  var issues = [];
  var actionItems = [];

  if (tCPA>0 && curCPA>tCPA) {
    var overPct = Math.round((curCPA-tCPA)/tCPA*100);
    issues.push({icon:"RED",label:"CPA超标",desc:"当前"+curCPA.toFixed(1)+"高于目标"+tCPA+"("+overPct+"%)",severity:"h"});
    actionItems.push("降低"+rk[rk.length-1].n+"等低效项目预算，转移至"+rk[0].n+"等高效项目");
  }

  if (db>pjDaily && pjDaily>0) {
    var usage = Math.round(pjDaily/db*100);
    if (usage<70) {
      issues.push({icon:"LAMP",label:"预算未用满",desc:"日均"+Math.round(pjDaily)+"，预算"+db+"(利用率"+usage+"%)",severity:"m"});
      actionItems.push("当前预算利用率仅"+usage+"%，建议加大推广力度或增加新项目");
    }
  }

  if (tCV>0 && dInq<tCV) {
    issues.push({icon:"CHART",label:"咨询不足",desc:"日均"+Math.round(dInq)+"个，目标"+tCV+"个",severity:"m"});
  }

  if (recCv>0 && searchCv>0) {
    var avgSearchCPA = searchCPA/searchCv;
    var avgRecCPA = recCPA/recCv;
    if (avgRecCPA>avgSearchCPA*1.2) {
      var efficientCnt = rk.filter(function(p){return !p.isSearch;}).length;
      var allRecCnt = ap.filter(function(p){return !p.isSearch;}).length;
      if (efficientCnt<allRecCnt*0.3) {
        actionItems.push("推荐项目CPA偏高("+avgRecCPA.toFixed(0)+")，仅筛选评分高的推荐项目保留，其余暂关");
      }
    }
  }

  html += '<div class="mg" style="margin-bottom:8px;font-weight:600;font-size:12px;color:#555">诊断</div>';
  for (var ii=0; ii<issues.length; ii++) {
    var is = issues[ii];
    var lc = is.severity=="h" ? "ri h" : (is.severity=="m" ? "ri m" : "ri");
    html += '<div class="ri '+lc+'"><div class="ri-icon">'+is.icon+'</div><div class="ri-c"><div class="ri-t">'+is.label+'</div><div class="ri-d">'+is.desc+'</div></div><div class="ri-s">'+(is.severity=="h"?"重要":(is.severity=="m"?"注意":"参考"))+'</div></div>';
  }

  if (issues.length===0) {
    html += '<div class="ri" style="border-left-color:#2e7d32"><div class="ri-icon">OK</div><div class="ri-c"><div class="ri-t">一切正常</div><div class="ri-d">账户运行良好，无异常指标</div></div></div>';
  }

  html += '<div class="mg" style="margin:10px 0 8px;font-weight:600;font-size:12px;color:#555">操作建议</div>';
  for (var jj=0; jj<actionItems.length; jj++) {
    html += '<div class="ri ri h" style="border-left-color:#1565c0"><div class="ri-icon">ACTION</div><div class="ri-c"><div class="ri-t">建议操作</div><div class="ri-d">'+actionItems[jj]+'</div></div></div>';
  }

  html += '<div class="mg" style="margin:10px 0 8px;font-weight:600;font-size:12px;color:#555">优先投放</div>';
  for (var kk=0; kk<top3.length; kk++) {
    var p = top3[kk];
    var icons = ["1ST","2ND","3RD"];
    var detail = "CPA"+p.cpa.toFixed(0)+" | 每千元"+p.iqk+"询盘 | 日均"+p.ad.toFixed(0)+" | "+(p.ord||0)+"单";
    html += '<div class="ri ri h" style="border-left-color:#2e7d32"><div class="ri-icon">'+icons[kk]+'</div><div class="ri-c"><div class="ri-t">'+p.n+(p.isSearch?" 搜索":"")+(p.ord>0?" "+p.ord+"单":"")+'</div><div class="ri-d">'+detail+'</div></div><div class="ri-s">优先级'+(kk+1)+'</div></div>';
  }

  if (bot3.length>0) {
    html += '<div class="mg" style="margin:10px 0 8px;font-weight:600;font-size:12px;color:#555">待优化</div>';
    for (var ll=0; ll<bot3.length; ll++) {
      var p2 = bot3[ll];
      var reason = p2.cpa>tCPA*1.3 ? "CPA"+p2.cpa.toFixed(0)+"超目标"+(tCPA?Math.round((p2.cpa-tCPA)/tCPA*100)+"%":"高") : "无成单";
      html += '<div class="ri ri m" style="border-left-color:#c62828"><div class="ri-icon">DOWN</div><div class="ri-c"><div class="ri-t">'+p2.n+(p2.isSearch?" 搜索":"")+'</div><div class="ri-d">'+reason+' | 每千元'+p2.iqk+'询盘 | 日均'+p2.ad.toFixed(0)+'</div></div><div class="ri-s">降预算</div></div>';
    }
  }

  html += '</div>';
  return html;
}`;

const combined = before + newAdv + '\n' + loadFunc + after;
fs.writeFileSync('C:/Users/Administrator/promo-site/tmp_combined_final.js', combined);

try {
    execSync('node --check C:/Users/Administrator/promo-site/tmp_combined_final.js', { stdio: 'pipe', timeout: 5000 });
    console.log('Combined with new advTX: OK');
} catch(e) {
    console.log('Combined with new advTX: FAIL');
}

// Now also write the HTML version
const html = fs.readFileSync('index.html', 'utf-8');
const newHtml = html.replace(
    /function advTX\([^)]+\)\{[^}]*\}[^a]*async function loadAllData/s,
    newAdv + '\n' + loadFunc.split('\n').slice(1).join('\n') // remove the first line (duplicate function keyword)
);
