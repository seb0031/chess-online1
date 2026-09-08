const FILES="abcdefgh";
const clone=b=>b.map(r=>r.slice());
function initialBoard(){return[
["br","bn","bb","bq","bk","bb","bn","br"],
["bp","bp","bp","bp","bp","bp","bp","bp"],
[null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null],
[null,null,null,null,null,null,null,null],
["wp","wp","wp","wp","wp","wp","wp","wp"],
["wr","wn","wb","wq","wk","wb","wn","wr"]]}
function initialState(){return{board:initialBoard(),turn:"w",castling:{wk:true,wq:true,bk:true,bq:true},enPassant:null,captured:{w:[],b:[]},halfmove:0,fullmove:1,history:[],status:"playing",winner:null,reason:null}}
function sq(s){return/^[a-h][1-8]$/.test(s)?[8-+s[1],s.charCodeAt(0)-97]:null}
function name(r,c){return r>=0&&r<8&&c>=0&&c<8?String.fromCharCode(97+c)+(8-r):null}
const col=p=>p&&p[0], typ=p=>p&&p[1], opp=c=>c==="w"?"b":"w", inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
function king(b,c){for(let r=0;r<8;r++)for(let x=0;x<8;x++)if(b[r][x]===c+"k")return[r,x];return null}
function attacked(b,r,c,by){
  const pr=by==="w"?r+1:r-1;
  for(const dc of[-1,1])if(inside(pr,c+dc)&&b[pr][c+dc]===by+"p")return true;
  for(const [dr,dc] of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]])if(inside(r+dr,c+dc)&&b[r+dr][c+dc]===by+"n")return true;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)if((dr||dc)&&inside(r+dr,c+dc)&&b[r+dr][c+dc]===by+"k")return true;
  for(const [dr,dc] of[[-1,0],[1,0],[0,-1],[0,1]]){
    let R=r+dr,C=c+dc;while(inside(R,C)){let p=b[R][C];if(p){if(col(p)===by&&(typ(p)==="r"||typ(p)==="q"))return true;break}R+=dr;C+=dc}
  }
  for(const [dr,dc] of[[-1,-1],[-1,1],[1,-1],[1,1]]){
    let R=r+dr,C=c+dc;while(inside(R,C)){let p=b[R][C];if(p){if(col(p)===by&&(typ(p)==="b"||typ(p)==="q"))return true;break}R+=dr;C+=dc}
  }
  return false;
}
function inCheck(b,c){const k=king(b,c);return!k||attacked(b,k[0],k[1],opp(c))}
function add(a,from,to,x={}){a.push({from,to,...x})}
function pseudo(s,c){
 const b=s.board,a=[];
 for(let r=0;r<8;r++)for(let x=0;x<8;x++){const p=b[r][x];if(!p||col(p)!==c)continue;const t=typ(p),from=name(r,x);
  if(t==="p"){const d=c==="w"?-1:1,start=c==="w"?6:1,last=c==="w"?0:7,R=r+d;
   if(inside(R,x)&&!b[R][x]){add(a,from,name(R,x),R===last?{promotion:true}:{});if(r===start&&!b[r+2*d][x])add(a,from,name(r+2*d,x),{doublePawn:true})}
   for(const dc of[-1,1]){const R2=r+d,C=x+dc;if(!inside(R2,C))continue;const q=b[R2][C],to=name(R2,C);if(q&&col(q)!==c&&typ(q)!=="k")add(a,from,to,R2===last?{promotion:true}:{});if(s.enPassant===to)add(a,from,to,{enPassant:true})}
  } else if(t==="n"){for(const[dR,dC]of[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]){const R=r+dR,C=x+dC;if(inside(R,C)&&(!b[R][C]||(col(b[R][C])!==c&&typ(b[R][C])!=="k")))add(a,from,name(R,C))}}
  else if("brq".includes(t)){const ds=[];if("bq".includes(t))ds.push([-1,-1],[-1,1],[1,-1],[1,1]);if("rq".includes(t))ds.push([-1,0],[1,0],[0,-1],[0,1]);for(const[dR,dC]of ds){let R=r+dR,C=x+dC;while(inside(R,C)){if(!b[R][C])add(a,from,name(R,C));else{if(col(b[R][C])!==c&&typ(b[R][C])!=="k")add(a,from,name(R,C));break}R+=dR;C+=dC}}}
  else if(t==="k"){for(let dR=-1;dR<=1;dR++)for(let dC=-1;dC<=1;dC++)if((dR||dC)&&inside(r+dR,x+dC)&&(!b[r+dR][x+dC]||(col(b[r+dR][x+dC])!==c&&typ(b[r+dR][x+dC])!=="k")))add(a,from,name(r+dR,x+dC));
   const row=c==="w"?7:0;if(r===row&&x===4&&!inCheck(b,c)){const e=opp(c),ks=c==="w"?s.castling.wk:s.castling.bk,qs=c==="w"?s.castling.wq:s.castling.bq;if(ks&&b[row][7]===c+"r"&&!b[row][5]&&!b[row][6]&&!attacked(b,row,5,e)&&!attacked(b,row,6,e))add(a,from,name(row,6),{castle:"k"});if(qs&&b[row][0]===c+"r"&&!b[row][1]&&!b[row][2]&&!b[row][3]&&!attacked(b,row,3,e)&&!attacked(b,row,2,e))add(a,from,name(row,2),{castle:"q"})}
  }
 }return a
}
function apply(s,m,prom="q"){
 const n={...s,board:clone(s.board),castling:{...s.castling},captured:{w:[...s.captured.w],b:[...s.captured.b]},history:[...s.history]};
 const[F,C]=sq(m.from),[R,D]=sq(m.to),piece=n.board[F][C];let cap=n.board[R][D];n.board[F][C]=null;
 if(m.enPassant){const cr=col(piece)==="w"?R+1:R-1;cap=n.board[cr][D];n.board[cr][D]=null}
 n.board[R][D]=m.promotion?col(piece)+prom:piece;
 if(m.castle==="k"){const row=col(piece)==="w"?7:0;n.board[row][5]=col(piece)+"r";n.board[row][7]=null}
 if(m.castle==="q"){const row=col(piece)==="w"?7:0;n.board[row][3]=col(piece)+"r";n.board[row][0]=null}
 if(piece==="wk")n.castling.wk=n.castling.wq=false;if(piece==="bk")n.castling.bk=n.castling.bq=false;
 if(piece==="wr"&&m.from==="a1")n.castling.wq=false;if(piece==="wr"&&m.from==="h1")n.castling.wk=false;if(piece==="br"&&m.from==="a8")n.castling.bq=false;if(piece==="br"&&m.from==="h8")n.castling.bk=false;
 if(cap==="wr"&&m.to==="a1")n.castling.wq=false;if(cap==="wr"&&m.to==="h1")n.castling.wk=false;if(cap==="br"&&m.to==="a8")n.castling.bq=false;if(cap==="br"&&m.to==="h8")n.castling.bk=false;
 if(cap)n.captured[col(piece)].push(cap);
 n.enPassant=null;if(typ(piece)==="p"&&Math.abs(R-F)===2)n.enPassant=name((R+F)/2,C);
 n.halfmove=(typ(piece)==="p"||cap)?0:n.halfmove+1;if(col(piece)==="b")n.fullmove++;n.turn=opp(col(piece));return n
}
function legal(s,c=s.turn){return pseudo(s,c).filter(m=>!inCheck(apply(s,m,"q").board,c))}
function key(s){return JSON.stringify({b:s.board,t:s.turn,c:s.castling,e:s.enPassant})}
function insufficient(b){const ps=b.flat().filter(Boolean),n=ps.filter(p=>p[1]!=="k");if(!n.length)return true;if(n.some(p=>"pqr".includes(p[1])))return false;if(n.length===1)return"bn".includes(n[0][1]);if(n.length===2&&n.every(p=>p[1]==="b")){let cs=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++)if(b[r][c]?.[1]==="b")cs.push((r+c)%2);return cs[0]===cs[1]}return false}
function status(s){const lm=legal(s);if(!lm.length){if(inCheck(s.board,s.turn)){s.status="checkmate";s.winner=opp(s.turn);s.reason="mat"}else{s.status="stalemate";s.winner=null;s.reason="pat"}return s}if(insufficient(s.board)){s.status="draw";s.reason="material_insuffisant";s.winner=null;return s}if(s.halfmove>=100){s.status="draw";s.reason="regle_des_50_coups";s.winner=null;return s}if(s.history.filter(k=>k===key(s)).length+1>=3){s.status="draw";s.reason="triple_repetition";s.winner=null;return s}s.status="playing";s.winner=null;s.reason=inCheck(s.board,s.turn)?"echec":null;return s}
function makeMove(s,from,to,prom){if(s.status!=="playing")return{ok:false,error:"game_over"};const m=legal(s).find(x=>x.from===from&&x.to===to);if(!m)return{ok:false,error:"illegal_move"};if(m.promotion&&!["q","r","b","n"].includes(prom))return{ok:false,error:"promotion_required"};if(!m.promotion&&prom)return{ok:false,error:"unexpected_promotion"};const n=apply(s,m,prom||"q");n.history.push(key(s));status(n);return{ok:true,state:n,move:{from,to,promotion:m.promotion?prom:null,captured:s.board[sq(to)[0]][sq(to)[1]]||null,castle:m.castle||null,enPassant:!!m.enPassant}}}
function serialize(s){return{board:s.board,turn:s.turn,castling:s.castling,enPassant:s.enPassant,captured:s.captured,status:s.status,winner:s.winner,reason:s.reason,inCheck:s.status==="playing"&&inCheck(s.board,s.turn),fullmove:s.fullmove}}
module.exports={initialState,makeMove,serialize};
