"""Preserve v1 IDs; generate a deterministic month-sized beginner curriculum."""
import chess,json,random
from pathlib import Path
from data_rules import solutions,position_key
ROOT=Path(__file__).resolve().parents[1]
rng=random.Random(20261022)
legacy=json.loads((ROOT/'data/legacy.json').read_text())
groups=legacy['groups'];puzzles=legacy['puzzles'];used={position_key(q['fen']) for q in puzzles+[q for g in groups for q in g['items']]}
serial=100

def make(board,kind,title,explain,goal=None,rule=None):
    global serial
    if not board.is_valid() or board.is_check() or position_key(board.fen()) in used:return None
    proto={'kind':kind,'rule':rule};ss=solutions(board,proto)
    if len(ss)!=1:return None
    used.add(position_key(board.fen()));serial+=1;move=chess.Move.from_uci(ss[0])
    q=dict(id=f'n{serial:04}',fen=board.fen(),solution=ss[0],title=title,explain=explain,goal=goal or '一步将杀',kind=kind,hint='先看看 '+chess.square_name(move.from_square)+' 上的棋子。',retry='再观察一次：将军、吃子和对方的逃跑格。')
    if rule:q['rule']=rule
    return q

def generate(config,count,title,explain,kind='mate',goal=None):
    result=[]
    for _ in range(350000):
        b=chess.Board(None)
        black=rng.choice([chess.square(f,r) for f in range(8) for r in [6,7]]) if kind=='mate' else rng.randrange(64)
        sq=rng.sample([s for s in chess.SQUARES if s!=black],len(config)+1)
        b.set_piece_at(black,chess.Piece(chess.KING,False));b.set_piece_at(sq[0],chess.Piece(chess.KING,True))
        for (piece,color),square in zip(config,sq[1:]):b.set_piece_at(square,chess.Piece(piece,color))
        if kind=='mate' and b.is_valid() and rng.random()<.25:b=b.mirror()
        q=make(b,kind,title,explain,goal)
        if q:result.append(q)
        if len(result)==count:return result
    raise RuntimeError('Could not generate '+title)

def variants(template,count):
    result=[];original=chess.Board(template['fen'])
    for repetition in range(20):
     for transform in [None,chess.flip_horizontal]:
      original=chess.Board(template['fen']);original=original.transform(transform) if transform else original
      for mirror in [False,True]:
       for dx in range(-6,7):
        for dy in range(-5,6):
         b=chess.Board(None)
         for sq,piece in original.piece_map().items():
             f,r=chess.square_file(sq)+dx,chess.square_rank(sq)+dy
             if not(0<=f<8 and 0<=r<8):break
             b.set_piece_at(chess.square(f,r),piece)
         else:
             if mirror:b=b.mirror()
             own=b.turn;old_king=b.king(own);b.remove_piece_at(old_king)
             empty=[sq for sq in chess.SQUARES if not b.piece_at(sq)]
             b.set_piece_at(rng.choice(empty),chess.Piece(chess.KING,own))
             q=make(b,template['kind'],template['title'],template['explain'],template['goal'])
             if q:result.append(q)
             if len(result)==count:return result
    raise RuntimeError('Insufficient variants: '+template['kind'])
Q,R,B,N,P=chess.QUEEN,chess.ROOK,chess.BISHOP,chess.KNIGHT,chess.PAWN
specs=[
 ('后沿直线封路','直线观察员',[(Q,True)],'用后控制直线，先检查对方的退路。'),
 ('后走斜线封路','斜线观察员',[(Q,True)],'后也能走斜线，留意王能逃到哪里。'),
 ('王后的默契','王后好搭档',[(Q,True)],'后负责将军，自己的王帮助控制逃跑格。'),
 ('车的直线力量','小车司机',[(R,True)],'车走直线，和王一起完成最后一步。'),
 ('双车接力','双车接力手',[(R,True),(R,True)],'两辆车分工，先看哪一辆已经封住退路。'),
 ('后象合作','斜线好朋友',[(Q,True),(B,True)],'象帮忙控制斜线，后找到将军的格子。'),
 ('马车协作','马车伙伴',[(R,True),(N,True)],'马跳着控制格子，车寻找直线上的机会。'),
 ('后马配合','后马小队长',[(Q,True),(N,True)],'把马控制的格子也算进来，再找后的一步杀。'),
 ('吃掉无保护的后','大子发现家',[(R,True),(Q,False)],'先找吃子，看看能不能安全吃掉对方的后。','capture','一步吃掉对方的后'),
 ('捉双再练练','小马侦探',None,''),
 ('牵制再练练','牵制小达人',None,''),
 ('闪击再练练','闪击发现家',None,''),
 ('串击再练练','串击小达人',None,''),
 ('黑棋也会将杀','黑棋小勇士',[(Q,True)],'执黑时同样先找将军，留意棋盘方向。'),
 ('多一个帮手','配合小专家',[(Q,True),(B,True)],'每个帮手都能控制格子，仔细检查。'),
 ('月末杀法挑战','月度小棋士',[(Q,True),(N,True)],'慢慢想，检查每个逃跑格，再走关键一步。')]
for i,spec in enumerate(specs):
    title,badge,config,explain,*rest=spec
    if config:items=generate(config,6,title,explain,*(rest or []))
    else:items=variants(legacy['groups'][2]['items'][i-9],6)
    if title=='黑棋也会将杀':
        for q in items:
            if chess.Board(q['fen']).turn:
                b=chess.Board(q['fen']).mirror();m=chess.Move.from_uci(q['solution']);q.update(fen=b.fen(),solution=chess.Move(chess.square_mirror(m.from_square),chess.square_mirror(m.to_square),promotion=m.promotion).uci());q['hint']='执黑，先找能将军的棋子。'
    groups.append(dict(id=f'group-{len(groups)+1}',title=title,badge=badge,description=explain or items[0]['explain'],items=items))
# 180 puzzles = 30 days x 5, plus 30 spare positions. Include meaningful tactical variety.
puzzles+=generate([(Q,True)],50,'找到一步杀','先找将军，再检查对方的所有逃跑格。')
puzzles+=generate([(R,True),(R,True)],35,'双车的好机会','一辆车封路，另一辆车完成将杀。')
puzzles+=generate([(Q,True),(B,True)],25,'后象合作','留意象控制的斜线，找到一步将杀。')
puzzles+=generate([(R,True),(Q,False)],16,'抓住大子','对方的后没有保护，看看谁能吃掉它。','capture','一步吃掉对方的后')
for template in legacy['groups'][2]['items'][:4]:puzzles+=variants(template,6)
assert len(puzzles)==180
lessons=[]
opening=[
 ('先占中心',[],'e2e4',P,'e4','e2','王前兵走两格到 e4','中心像小操场，先让棋子有活动空间。',['先看中心四格。','王前兵走两格，给象和后让路。','开局不用急着出后。']),
 ('马先出来',['e4','e5'],'g1f3',N,'f3','g1','把王翼马发展到 f3','马向中心发展，顺便攻击 e5 兵。',['先发展马和象。','小马靠近中心，能看更多格子。','同一枚棋子不要来回走太多次。']),
 ('让象帮忙',['e4','e5','Nf3','Nc6'],'f1c4',B,'c4','f1','把王翼象发展到 c4','象到 c4，朝向对方王翼。',['出马以后再出象。','出象时看看斜线上有什么。','不要只顾进攻，自己的王也要安全。']),
 ('给王一个家',['e4','e5','Nf3','Nc6','Bc4','Bc5'],'e1g1',None,None,None,'完成王翼易位','王离开中心，车也加入了配合。',['王和车都不能走过。','王经过的格子不能被攻击。','易位后别随便推开王前的兵。']),
 ('后前兵占中心',[],'d2d4',P,'d4','d2','后前兵走两格到 d4','另一种占中心的方法是先走 d4。',['中心不只有 e4。','d4 也给象打开一条路。','每走一步都观察对手的威胁。']),
 ('另一匹马也出发',['d4','d5'],'b1c3',N,'c3','b1','把后翼马发展到 c3','两匹马一起靠近中心。',['两匹马都需要活动。','c3 的马帮助看住中心。','先发展，再想进攻。']),
 ('黑棋也抢中心',['e4'],'e7e5',P,'e5','e7','黑方王前兵走两格到 e5','执黑同样可以占中心。',['执黑时看清棋盘方向。','中心的兵需要棋子保护。','先做自己的发展。']),
 ('黑马向中心',['e4','e5','Nf3'],'b8c6',N,'c6','b8','黑方后翼马发展到 c6','黑马到 c6，保护 e5 的兵。',['看对方刚走的一步。','用发展棋子的方法保护兵。','马在中心附近更活跃。']),
 ('黑象打开斜线',['e4','e5','Nf3','Nc6','Bc4'],'f8c5',B,'c5','f8','黑方王翼象发展到 c5','出象，准备让自己的王安全。',['发展棋子也能形成威胁。','出后之前，先看看马和象。','朝王翼易位做准备。']),
 ('黑王安全易位',['e4','e5','Nf3','Nc6','Bc4','Bc5','O-O','Nf6','d3'],'e8g8',None,None,None,'黑方完成王翼易位','黑王也要住进安全的小家。',['不是只有白棋能易位。','检查王经过的两个格子。','易位以后让两辆车互相照应。'])]
for i,(title,line,uci,piece,target,origin,goal,explain,points) in enumerate(opening):
    b=chess.Board()
    for san in line:b.push_san(san)
    rule={'action':'castle'} if piece is None else {'action':'develop','piece':piece,'target':target,'from':origin}
    q=make(b,'opening',title,explain,goal,rule)
    # Two different opening lessons can begin from the initial board: goal differs, so allow it.
    if q is None:
        q=dict(id=f'opening-ex-{i}',fen=b.fen(),solution=uci,title=title,explain=explain,goal=goal,kind='opening',rule=rule,hint=goal,retry='先看看这课的目标，再找起点和终点。')
    assert solutions(b,q)==[uci]
    lessons.append(dict(id=f'opening-{i+1}',phase='opening',title=title,minutes=12,points=points,exercise=q,demoMoves=[uci]))
# Separate positions for lessons so planner assignments never depend on shared puzzle completion.
middle_templates=legacy['groups'][2]['items'][:4]
for i in range(10):
    source=middle_templates[i%4];q=variants(source,1)[0]
    lessons.append(dict(id=f'middle-{i+1}',phase='middle',title=['先找将军与捉双','牵制后再吃子','让开线路做闪击','同一条线上的串击'][i%4]+f' · {i//4+1}',minutes=12,points=[q['explain'],'落子前先看对手有没有将军或吃子。','想好后再走，走错可以重新观察。'],exercise=q,demoMoves=[q['solution']]))
for i in range(10):
    cfg=[[(Q,True)],[(R,True)],[(R,True),(R,True)]][i%3];q=generate(cfg,1,['王后配合收尾','王车配合收尾','双车合作收尾'][i%3],'先用帮手控制退路，再走出将杀的一步。')[0]
    lessons.append(dict(id=f'ending-{i+1}',phase='ending',title=q['title']+f' · {i//3+1}',minutes=12,points=['王也要靠近，帮助控制对方的逃跑格。','每次将军后，检查对方能逃到哪里。','注意逼和：没有被将军但无棋可走，算和棋。'],exercise=q,demoMoves=[q['solution']]))
content={'groups':groups,'puzzles':puzzles,'lessons':lessons}
(ROOT/'data/curriculum.json').write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')
(ROOT/'src/content.js').write_text('// Generated by tools/generate_data.py. Edit data sources or generator, not this file.\n'+''.join('const '+k+' = '+json.dumps(content[v],ensure_ascii=False)+';\n' for k,v in [('GROUPS','groups'),('PUZZLES','puzzles'),('LESSONS','lessons')]))
print('Generated',len(groups),'themes,',sum(len(g['items']) for g in groups),'practice positions,',len(puzzles),'puzzles,',len(lessons),'lessons')
