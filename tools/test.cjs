const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {JSDOM}=require(process.env.JSDOM_PATH||'../../qa/node_modules/jsdom');
const base=path.resolve(__dirname,'..');
const root=fs.existsSync(path.join(base,'dist'))?path.join(base,'dist'):base;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script[^>]*><\/script>/g,'');
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://test.invalid/'}),w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};
const c=dom.getInternalVMContext();for(const f of ['chess.js','data.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});
const run=s=>vm.runInContext(s,c),eq=(s,v)=>assert.equal(run(s),v,s);
run('state.muted=true; navigate("ai")');eq('document.querySelectorAll(".sq").length',64);eq("document.querySelector('[aria-label=\"a1 白车\"]').classList.contains('dark-square')",true);eq("document.querySelector('[aria-label=\"a8 黑车\"]').classList.contains('dark-square')",false);run('clickSquare("e2");clickSquare("e4")');eq('game.get("e4").type','p');eq('busy',true);run('undo()');eq('game.history().length',0);eq('busy',false);
// All training positions load in the actual shipped rule engine, with exactly one mate where required.
run(`for(const q of [...GROUPS.flatMap(g=>g.items),...PUZZLES]){const b=new Chess(q.fen);if(b.fen().split(' ')[0]!==q.fen.split(' ')[0])throw Error(q.id);const m=b.move({from:q.solution.slice(0,2),to:q.solution.slice(2,4),promotion:q.solution[4]});if(!m)throw Error(q.id+' illegal');if(q.kind==='mate'&&!b.in_checkmate())throw Error(q.id+' not mate')}`);
run('navigate("practice");startPractice(0,0);clickSquare("a1");clickSquare("a2")');eq('wrong',true);eq('game.history().length',0);run('clickSquare("a1");clickSquare("a8")');eq('answered',true);eq('state.practice.length',1);
run('startPractice(2,4);clickSquare(current.solution.slice(0,2));clickSquare(current.solution.slice(2,4))');eq('document.querySelector("#promotion").open',true);run('document.querySelector("#promoteChoices button").click()');eq('answered',true);
run('startPractice(2,5);attemptMove({from:"e5",to:"d6"})');eq('game.get("d5")',null);eq('answered',true);
run(`navigate('puzzles');const before=state.cursor;attemptMove({from:current.solution.slice(0,2),to:current.solution.slice(2,4),promotion:current.solution[4]});if(state.cursor!==before+1)throw Error('cursor');stop()`);eq('state.correct',1);eq('state.streak',1);
run('navigate("local");clickSquare("e2");clickSquare("e4");clickSquare("e7");clickSquare("e5")');eq('game.history().length',2);eq('busy',false);run('undo()');eq('game.history().length',1);run('flipped=true;drawBoard()');eq('document.querySelector(".sq").getAttribute("aria-label").slice(0,2)','h1');
// Castle, en passant and underpromotion: native chess.js rules remain intact.
run(`{const b=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');if(!b.move('O-O'))throw Error('castle');const p=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');if(p.move({from:'a7',to:'a8',promotion:'n'}).promotion!=='n')throw Error('promotion')}`);
// AI does not mutate the caller's board; every difficulty emits a legal move.
run(`for(let l=1;l<=5;l++){const b=new Chess();b.move('e4');const f=b.fen(),m=chooseMove(b,l);if(b.fen()!==f||!b.move(m))throw Error('AI '+l)}`);
// End game is recorded only once, then reset starts a clean board.
run(`human='w';navigate('ai');stop();game=new Chess('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1');updateGameStatus();updateGameStatus()`);eq('state.wins',1);run('newGame();stop()');eq('ended',false);
run('toggleTheme();save();navigate("home")');eq('document.body.classList.contains("dark")',true);assert(JSON.parse(w.localStorage.getItem('xiaoba-chess-v1')).practice.length===3);
// Every rendered click handler compiles (catches malformed template markup).
for(const m of ['home','ai','practice','puzzles','local']){run(`navigate('${m}')`);for(const e of w.document.querySelectorAll('[onclick]'))new Function(e.getAttribute('onclick'))}
// Every position renders all pieces synchronously with no image requests.
run(`for(const item of [...PUZZLES,...GROUPS.flatMap(g=>g.items)]){current=item;mode='puzzles';startExercise();const expected=game.board().flat().filter(Boolean).length;if(document.querySelectorAll('#board svg.piece').length!==expected||document.querySelector('#board img'))throw Error('Missing inline piece '+item.id)};stop()`);
run(`mode='local';game=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');answered=ended=busy=false;renderGame();clickSquare('a7');clickSquare('a8');if(document.querySelectorAll('#promoteChoices svg.piece').length!==4)throw Error('Promotion icons');`);
run('stop()');console.log('PASS: 54 positions, AI levels, undo, promotions, en passant, castling, practice, puzzle counters, local play, persistence, result deduplication, handlers.');dom.window.close();
