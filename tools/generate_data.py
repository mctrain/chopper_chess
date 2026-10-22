import chess, random, json
from pathlib import Path
random.seed(8)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist' if (ROOT/'dist').is_dir() else ROOT
def mates(b):
 out=[]
 for m in b.legal_moves:
  b.push(m); yes=b.is_checkmate();b.pop()
  if yes:out.append(m)
 return out
used=set()
def item(b,m,title,explain,goal='一步将杀',kind='mate',hint=None):
 assert b.is_valid(),b.fen()
 assert m in b.legal_moves
 f=b.fen(); assert f not in used;used.add(f)
 return dict(id='q'+str(len(used)).zfill(3),fen=f,solution=m.uci(),title=title,explain=explain,goal=goal,kind=kind,hint=hint or '看看 '+chess.square_name(m.from_square)+' 上的棋子，能不能封住对方的退路？',retry='别着急，再检查一下目标和对方的逃跑格。')
def gen(config,count,title,explain):
 out=[]
 for tries in range(200000):
  b=chess.Board(None); b.turn=chess.WHITE
  # 让黑王靠近底线，强调适合儿童的简单终结局面。
  bk=random.choice([chess.square(f,r) for f in range(8) for r in [6,7]])
  squares=random.sample([s for s in chess.SQUARES if s!=bk],len(config)+1)
  b.set_piece_at(bk,chess.Piece(chess.KING,chess.BLACK));b.set_piece_at(squares[0],chess.Piece(chess.KING,chess.WHITE))
  for (typ,color),sq in zip(config,squares[1:]):b.set_piece_at(sq,chess.Piece(typ,color))
  if not b.is_valid() or b.is_check() or b.fen() in used:continue
  ms=mates(b)
  if len(ms)==1:
   out.append(item(b,ms[0],title,explain))
   if len(out)==count:return out
 raise Exception('generation failed')
def explicit(fen,title,explain,goal,kind,pred,hint):
 b=chess.Board(fen);ms=[m for m in b.legal_moves if pred(b,m)];assert len(ms)==1,(kind,[m.uci() for m in ms]);return item(b,ms[0],title,explain,goal,kind,hint)
def fork(b,m):
 if b.piece_type_at(m.from_square)!=chess.KNIGHT:return False
 b.push(m);res=b.is_check() and any(b.piece_type_at(s)==chess.QUEEN and b.color_at(s)==chess.BLACK for s in b.attacks(m.to_square));b.pop();return res
# Board.color_at is implemented below using piece color for compatibility.
chess.Board.color_at=lambda self,s:self.piece_at(s).color if self.piece_at(s) else None
def pin(b,m):return b.piece_type_at(m.from_square)==chess.PAWN and b.piece_type_at(m.to_square)==chess.KNIGHT and b.is_pinned(chess.BLACK,m.to_square)
def discover(b,m):
 if b.piece_type_at(m.from_square)!=chess.BISHOP or b.piece_type_at(m.to_square)!=chess.QUEEN:return False
 b.push(m);res=b.is_check() and any(b.piece_type_at(s)==chess.ROOK for s in b.checkers());b.pop();return res
def skewer(b,m):
 if b.piece_type_at(m.from_square)!=chess.BISHOP:return False
 b.push(m);k=b.king(chess.BLACK);qs=list(b.pieces(chess.QUEEN,chess.BLACK));res=False
 for q in qs:
  ray=chess.ray(m.to_square,k);res|=bool(b.is_check() and ray & chess.BB_SQUARES[q] and chess.between(m.to_square,q)&chess.BB_SQUARES[k])
 b.pop();return res
T=[]
T.append(explicit('8/4k3/5q2/8/8/2N5/8/6K1 w - - 0 1','小马的双重攻击','马一边将军，一边攻击后；对方必须先救王。','用马同时攻击王和后','fork',fork,'小马从 c3 出发，找一个能同时攻击王和后的格子。'))
T.append(explicit('4k3/8/2n5/1B1P4/8/8/8/6K1 w - - 0 1','被牵住的小马','象把马牵制在王前面，用兵吃掉这匹马。','用兵吃掉被牵制的马','pin',pin,'沿着 b5 象的斜线看看：马后面是谁？'))
T.append(explicit('4k3/1q6/8/8/4B3/8/8/4R1K1 w - - 0 1','让开，车来将军','象吃后，同时让开车的线路，形成闪将。','移动象，吃后并形成闪将','discovery',discover,'e4 的象挡在车前面，它还能吃掉哪枚大子？'))
T.append(explicit('3q4/4k3/8/8/8/8/8/K1B5 w - - 0 1','一条线上的王和后','象将军，把王赶开，后面的后就会受到攻击。','用象将军，串击后面的后','skewer',skewer,'c1 的象走到哪里，能让王和后排在同一条斜线上？'))
# 唯一升变将杀：枚举三子残局，必须仅后升变将杀。
for _ in range(20000):
 b=chess.Board(None);f=random.randrange(8);p=chess.square(f,6);wk,bk=random.sample([s for s in chess.SQUARES if s!=p],2)
 for s,t,c in [(p,chess.PAWN,True),(wk,chess.KING,True),(bk,chess.KING,False)]:b.set_piece_at(s,chess.Piece(t,c))
 if b.is_valid():
  ms=mates(b)
  if len(ms)==1 and ms[0].promotion==chess.QUEEN:
   T.append(item(b,ms[0],'小兵的大变身','小兵到达底线，升变为后，一步将杀。','升变为后并将杀','mate'));break
else:raise Exception('promotion')
T.append(explicit('7k/8/8/3pP3/8/8/8/K7 w - d6 0 2','抓住这一回合','黑兵刚从 d7 走到 d5；白兵现在可以吃过路兵。','吃过路兵','enpassant',lambda b,m:b.is_en_passant(m),'e5 的白兵斜走到 d6，吃掉刚走两格的黑兵。'))
G1=[]
# 经典底线杀法的手工局面。
b=chess.Board('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');ms=mates(b);assert len(ms)==1
G1.append(item(b,ms[0],'底线上的机会','对方的兵挡住了王的逃路，让车进入底线将杀。'))
G1+=gen([(chess.QUEEN,True)],3,'后与王的配合','自己的王保护后，后封住对方王的逃跑格。')
G1+=gen([(chess.ROOK,True)],2,'车与王的配合','用王封路，让车沿直线完成将杀。')
G2=gen([(chess.QUEEN,True),(chess.BISHOP,True)],3,'斜线上的帮手','后和象互相配合，封住对方王的逃路。')+gen([(chess.ROOK,True),(chess.KNIGHT,True)],3,'马车合作','找出将军的一步，并检查每个逃跑格。')
G4=gen([(chess.ROOK,True),(chess.ROOK,True)],6,'双车守住两条线','一辆车封住退路，另一辆车完成将杀。')
P=gen([(chess.QUEEN,True)],10,'找到一步杀','先找将军，再确认对方没有安全的格子。')+gen([(chess.ROOK,True),(chess.ROOK,True)],8,'双车的好机会','一辆车负责封路，一辆车负责将军。')+gen([(chess.QUEEN,True),(chess.KNIGHT,True)],8,'和小马一起将杀','找到配合，让对方的王无处可逃。')
# 黑方视角与少量战术题，仍使用独立且已验证的局面。
for t in T[:4]:
 b=chess.Board(t['fen']);b=b.transform(chess.flip_horizontal);m=chess.Move(chess.parse_square(t['solution'][:2])^7,chess.parse_square(t['solution'][2:4])^7)
 P.append(item(b,m,t['title'],t['explain'],t['goal'],t['kind'],'留意 '+chess.square_name(m.from_square)+' 上的棋子。'))
# 一部分谜题镜像并交换颜色，练习执黑。
for i in range(6):
 q=P[i];b=chess.Board(q['fen']).mirror();m=chess.Move.from_uci(q['solution']);m=chess.Move(chess.square_mirror(m.from_square),chess.square_mirror(m.to_square),promotion=m.promotion);q.update(fen=b.fen(),solution=m.uci(),hint='看看 '+chess.square_name(m.from_square)+' 上的棋子，能不能封住对方的退路？')
GROUPS=[dict(title='后车杀法',badge='底线守护者',description='后、车与王协力，练熟最常见的将杀。',items=G1),dict(title='一回合杀',badge='将杀小能手',description='后象配合、马车协作，找出致胜的一步。',items=G2),dict(title='基础战术',badge='战术发现家',description='捉双、牵制、闪击、串击，还有小兵的妙招。',items=T),dict(title='双车杀法',badge='双车指挥官',description='双车交替封路，掌握阶梯式将杀的最后一步。',items=G4)]
# 最终逐题验证：mate 穷举所有合法着法；战术按明确的题目目标穷举。
checks={'fork':fork,'pin':pin,'discovery':discover,'skewer':skewer,'enpassant':lambda b,m:b.is_en_passant(m)}
report=[]
for q in [x for g in GROUPS for x in g['items']]+P:
 b=chess.Board(q['fen']);assert b.is_valid();kind=q['kind']
 if b.turn==chess.BLACK and kind!='mate':raise Exception('unsupported')
 ms=mates(b) if kind=='mate' else [m for m in b.legal_moves if checks[kind](b,m)]
 assert [m.uci() for m in ms]==[q['solution']],(q,ms)
 report.append(dict(id=q['id'],valid=True,unique=True,objective=q['goal'],solution=q['solution'],legal_moves=b.legal_moves.count()))
(OUT/'data.js').write_text('const GROUPS='+json.dumps(GROUPS,ensure_ascii=False)+';\nconst PUZZLES='+json.dumps(P,ensure_ascii=False)+';\n')
(ROOT/'tools/validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('Verified',len(report),'positions;',len(P),'puzzles;',sum(len(g['items']) for g in GROUPS),'practice levels')
