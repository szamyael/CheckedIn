import 'package:flutter/material.dart';

import '../../services/bingo_service.dart';
import '../../widgets/student_ui.dart';

class BingoScreen extends StatefulWidget {
  const BingoScreen({super.key});
  @override
  State<BingoScreen> createState() => _BingoScreenState();
}

class _BingoScreenState extends State<BingoScreen> {
  final _service = BingoService();
  List<BingoCardSummary> _cards = [];
  String? _selectedId;
  BingoBoardData? _board;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({String? cardId}) async {
    setState(() => _loading = true);
    try {
      final cards = await _service.fetchPublishedCards();
      final saved = cardId ?? await _service.readSavedCardId();
      final selected = cards.any((card) => card.id == saved)
          ? saved
          : (cards.isEmpty ? null : cards.first.id);
      BingoBoardData? board;
      if (selected != null) {
        board = await _service.fetchBoard(selected);
        await _service.saveSelectedCardId(selected);
      }
      if (!mounted) return;
      setState(() {
        _cards = cards;
        _selectedId = selected;
        _board = board;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  Future<void> _selectCard(String cardId) async {
    if (cardId == _selectedId) return;
    setState(() {
      _selectedId = cardId;
      _loading = true;
    });
    await _service.saveSelectedCardId(cardId);
    final board = await _service.fetchBoard(cardId);
    if (!mounted) return;
    setState(() {
      _board = board;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () => _load(cardId: _selectedId),
    child: _loading && _board == null
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            children: [
              const Text('EVENT BINGO', style: TextStyle(color: StudentUi.muted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
              const SizedBox(height: 8),
              if (_cards.isEmpty)
                const StudentEmptyState(icon: Icons.grid_view_rounded, message: 'No published Bingo cards yet. Check back when an organization publishes one.')
              else ...[
                if (_cards.length > 1) ...[
                  const Text('Choose a bingo card', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF0C2238))),
                  const SizedBox(height: 8),
                  InputDecorator(
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: _selectedId,
                        items: _cards
                            .map(
                              (card) => DropdownMenuItem(
                                value: card.id,
                                child: Text(
                                  card.seasonLabel.isEmpty
                                      ? card.title
                                      : '${card.title} · ${card.seasonLabel}',
                                ),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          if (value != null) void _selectCard(value);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (_board == null)
                  const StudentEmptyState(icon: Icons.grid_view_rounded, message: 'This bingo card is no longer available.')
                else ...[
                  Text(_board!.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 27, color: const Color(0xFF0C2238))),
                  const SizedBox(height: 5),
                  Text('${_board!.completedCellIds.length} / ${_board!.cells.length} completed | ${_board!.seasonLabel}', style: const TextStyle(color: StudentUi.muted, fontSize: 13)),
                  const SizedBox(height: 16),
                  Row(children: [Expanded(child: _Metric(label: 'Event streak', value: '${_board!.streak}', color: const Color(0xFF17324D))), const SizedBox(width: 8), Expanded(child: _Metric(label: 'Lines complete', value: _board!.hasLine ? '1' : '0', color: const Color(0xFFA46618)))]),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(2), color: const Color(0xFF17324D),
                    child: GridView.builder(
                      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), itemCount: 9,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 2, mainAxisSpacing: 2),
                      itemBuilder: (context, position) {
                        final cell = _board!.cells.cast<BingoCellView?>().firstWhere((c) => c?.position == position, orElse: () => null);
                        final done = cell != null && _board!.completedCellIds.contains(cell.id);
                        return Container(
                          padding: const EdgeInsets.all(8), color: done ? const Color(0xFFFFF6DF) : Colors.white,
                          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Text(cell?.eventTitle ?? cell?.label ?? 'Empty', textAlign: TextAlign.center, maxLines: 3, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: done ? const Color(0xFF7C5311) : const Color(0xFF3F484F))),
                            if (done) const Padding(padding: EdgeInsets.only(top: 5), child: Icon(Icons.check_circle, size: 17, color: Color(0xFFA46618))),
                          ]),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Row(children: [Icon(Icons.workspace_premium_outlined, size: 19, color: Color(0xFFA46618)), SizedBox(width: 8), Text('Recognition earned', style: TextStyle(color: Color(0xFF0C2238), fontSize: 16, fontWeight: FontWeight.w700))]),
                  const SizedBox(height: 10),
                  if (_board!.awards.isEmpty)
                    const Text('Complete a line or streak on this card to earn badges.', style: TextStyle(color: StudentUi.muted))
                  else
                    ..._board!.awards.map((award) => Padding(padding: const EdgeInsets.only(bottom: 8), child: _AwardRow(name: award.name, points: award.points))),
                ],
              ],
            ],
          ),
  );
}

class _Metric extends StatelessWidget {
  final String label; final String value; final Color color;
  const _Metric({required this.label, required this.value, required this.color});
  @override Widget build(BuildContext context) => Container(padding: const EdgeInsets.all(14), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: StudentUi.border)), child: Column(children: [Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: color)), const SizedBox(height: 3), Text(label, style: const TextStyle(fontSize: 11, color: StudentUi.muted))]));
}

class _AwardRow extends StatelessWidget {
  final String name; final int points;
  const _AwardRow({required this.name, required this.points});
  @override Widget build(BuildContext context) => Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13), decoration: BoxDecoration(color: Colors.white, border: Border.all(color: StudentUi.border)), child: Row(children: [const Icon(Icons.stars_outlined, color: Color(0xFFC18A2E), size: 18), const SizedBox(width: 10), Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600))), Text('+$points', style: const TextStyle(color: Color(0xFFA46618), fontWeight: FontWeight.w700))]));
}
