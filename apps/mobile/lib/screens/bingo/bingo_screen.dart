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
  late Future<BingoBoardData?> _future;
  @override
  void initState() { super.initState(); _future = _service.fetchActiveBoard(); }
  Future<void> _refresh() async { setState(() => _future = _service.fetchActiveBoard()); await _future; }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: _refresh,
    child: FutureBuilder<BingoBoardData?>(
      future: _future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
        final board = snapshot.data;
        if (board == null) return ListView(padding: const EdgeInsets.all(24), children: const [StudentEmptyState(icon: Icons.grid_view_rounded, message: 'No active Bingo card yet. Check back when an organization publishes one.')]);
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
          children: [
            const Text('EVENT BINGO', style: TextStyle(color: StudentUi.muted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
            const SizedBox(height: 8),
            Text(board.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontSize: 27, color: const Color(0xFF0C2238))),
            const SizedBox(height: 5),
            Text('${board.completedCellIds.length} / ${board.cells.length} completed | ${board.seasonLabel}', style: const TextStyle(color: StudentUi.muted, fontSize: 13)),
            const SizedBox(height: 16),
            Row(children: [Expanded(child: _Metric(label: 'Event streak', value: '${board.streak}', color: const Color(0xFF17324D))), const SizedBox(width: 8), Expanded(child: _Metric(label: 'Lines complete', value: board.hasLine ? '1' : '0', color: const Color(0xFFA46618)))]),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(2), color: const Color(0xFF17324D),
              child: GridView.builder(
                shrinkWrap: true, physics: const NeverScrollableScrollPhysics(), itemCount: 9,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 2, mainAxisSpacing: 2),
                itemBuilder: (context, position) {
                  final cell = board.cells.cast<BingoCellView?>().firstWhere((c) => c?.position == position, orElse: () => null);
                  final done = cell != null && board.completedCellIds.contains(cell.id);
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
            if (board.awards.isEmpty) const Text('Complete a line or streak to earn badges.', style: TextStyle(color: StudentUi.muted)) else ...board.awards.map((award) => Padding(padding: const EdgeInsets.only(bottom: 8), child: _AwardRow(name: award.name, points: award.points))),
          ],
        );
      },
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
