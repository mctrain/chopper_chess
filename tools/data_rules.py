"""Objective predicates, independent of the stored solution; shared by generator/validator."""
import chess

def matches(board, move, item):
    kind=item['kind'];side=board.turn;enemy=not side
    if kind=='enpassant':return board.is_en_passant(move)
    if kind=='capture':return board.is_capture(move) and board.piece_type_at(move.to_square)==chess.QUEEN
    if kind=='opening':
        rule=item['rule']
        if rule['action']=='castle':return board.is_kingside_castling(move)
        return board.piece_type_at(move.from_square)==rule['piece'] and move.to_square==chess.parse_square(rule['target']) and (not rule.get('from') or move.from_square==chess.parse_square(rule['from']))
    if kind=='pin':return board.piece_type_at(move.from_square)==chess.PAWN and board.piece_type_at(move.to_square)==chess.KNIGHT and board.is_pinned(enemy,move.to_square)
    if kind=='fork':
        if board.piece_type_at(move.from_square)!=chess.KNIGHT:return False
        board.push(move);yes=board.is_check() and bool(board.attacks(move.to_square)&board.pieces(chess.QUEEN,enemy));board.pop();return yes
    if kind=='discovery':
        if board.piece_type_at(move.from_square)!=chess.BISHOP or board.piece_type_at(move.to_square)!=chess.QUEEN:return False
        board.push(move);yes=board.is_check() and any(board.piece_type_at(s)==chess.ROOK for s in board.checkers());board.pop();return yes
    if kind=='skewer':
        if board.piece_type_at(move.from_square)!=chess.BISHOP:return False
        board.push(move);king=board.king(enemy);yes=board.is_check() and any(chess.ray(move.to_square,king)&chess.BB_SQUARES[q] and chess.between(move.to_square,q)&chess.BB_SQUARES[king] for q in board.pieces(chess.QUEEN,enemy));board.pop();return bool(yes)
    if kind=='mate':
        board.push(move);yes=board.is_checkmate();board.pop();return yes
    raise ValueError('Unknown objective: '+kind)

def solutions(board,item):return [m.uci() for m in list(board.legal_moves) if matches(board,m,item)]
def position_key(fen):return ' '.join(fen.split()[:4])
