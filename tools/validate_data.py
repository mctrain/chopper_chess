"""Re-enumerate all legal moves; fail if any solution is illegal/non-unique."""
import chess,json
from pathlib import Path
from data_rules import solutions,position_key
ROOT=Path(__file__).resolve().parents[1]
def validate():
    data=json.loads((ROOT/'data/curriculum.json').read_text());ids=set();positions=set();report=[]
    exercises=[(q,False) for g in data['groups'] for q in g['items']]+[(q,False) for q in data['puzzles']]+[(l['exercise'],True) for l in data['lessons']]
    for q,lesson in exercises:
        assert q['id'] not in ids,q['id'];ids.add(q['id'])
        b=chess.Board(q['fen']);assert b.is_valid(),q
        matches=solutions(b,q);assert matches==[q['solution']],(q['id'],matches,q['solution'])
        key=position_key(q['fen'])
        if not lesson:assert key not in positions,('duplicate position',q['id'])
        positions.add(key);report.append({'id':q['id'],'valid':True,'unique':True,'objective':q['goal'],'solution':q['solution'],'legalMoves':b.legal_moves.count()})
    for lesson in data['lessons']:
        b=chess.Board(lesson['exercise']['fen'])
        for uci in lesson['demoMoves']:
            m=chess.Move.from_uci(uci);assert m in b.legal_moves,lesson['id'];b.push(m)
    assert len(data['groups'])==20 and len(data['puzzles'])>=155 and len(data['lessons'])>=30
    for phase in ['opening','middle','ending']:assert len([l for l in data['lessons'] if l['phase']==phase])>=10
    (ROOT/'tools/validation-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('PASS:',len(exercises),'legal, uniquely solved positions; 30 legal lesson demonstrations; no duplicate practice/puzzle positions')
if __name__=='__main__':validate()
