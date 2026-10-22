// Depth is measured in half-moves; all levels intentionally remain beginner strength.
const AI_LEVELS = [null,
  {name:'小蜗牛 · 陪我试试',depth:0,noise:0,blunder:1},
  {name:'小兔子 · 看看吃子',depth:1,noise:220,blunder:.5},
  {name:'小松鼠 · 想一小步',depth:1,noise:140,blunder:.35},
  {name:'小海豚 · 多看一眼',depth:2,noise:90,blunder:.24},
  {name:'小狮子 · 小小挑战',depth:2,noise:45,blunder:.15}];
const values={p:100,n:300,b:310,r:500,q:900,k:0};
function evaluate(g,side){
  if(g.in_checkmate()) return g.turn()===side?-100000:100000;
  if(g.in_draw()) return 0;
  let score=0;
  g.board().forEach((rank,r)=>rank.forEach((p,f)=>{if(p)score+=(p.color===side?1:-1)*(values[p.type]+(p.type==='p'?(p.color==='w'?6-r:r-1)*6:0)+(['n','b'].includes(p.type)?(3.5-Math.abs(3.5-f))*6:0))}));
  return score;
}
function search(g,depth,side,alpha=-Infinity,beta=Infinity){
  if(!depth||g.game_over())return evaluate(g,side);
  const maximizing=g.turn()===side;let best=maximizing?-Infinity:Infinity;
  for(const m of g.moves({verbose:true}).sort((a,b)=>(values[b.captured]||0)-(values[a.captured]||0))){
    g.move(m);const score=search(g,depth-1,side,alpha,beta);g.undo();
    best=maximizing?Math.max(best,score):Math.min(best,score);
    if(maximizing)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
    if(beta<=alpha)break;
  }return best;
}
function chooseMove(g,level=5,deterministic=false,rng=Math.random){
  const moves=g.moves({verbose:true});if(!moves.length)return null;
  const cfg=AI_LEVELS[Math.max(1,Math.min(5,Number(level)||1))];
  const random=list=>list[Math.min(list.length-1,Math.floor(rng()*list.length))];
  if(cfg.depth===0&&!deterministic){const captures=moves.filter(m=>m.captured);return random(captures.length?captures:moves)}
  if(!deterministic&&rng()<cfg.blunder)return random(moves);
  const side=g.turn();let best=-Infinity,choice=moves[0];
  for(const m of moves){g.move(m);const score=search(g,Math.max(1,cfg.depth)-1,side)+(g.in_check()?15:0)+(deterministic?0:(rng()-.5)*cfg.noise);g.undo();if(score>best){best=score;choice=m}}
  return choice;
}
