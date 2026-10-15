import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';

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
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({String? cardId}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
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
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load Bingo progress: $error';
        _loading = false;
      });
    }
  }

  Future<void> _selectCard(String cardId) async {
    if (cardId == _selectedId) return;
    setState(() {
      _selectedId = cardId;
      _loading = true;
      _error = null;
    });
    try {
      await _service.saveSelectedCardId(cardId);
      final board = await _service.fetchBoard(cardId);
      if (!mounted) return;
      setState(() {
        _board = board;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = 'Unable to load Bingo progress: $error';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: () => _load(cardId: _selectedId),
    child: _loading && _board == null
        ? const Center(child: CircularProgressIndicator())
        : ListView(
            padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
            children: [
              Text(
                'EVENT BINGO',
                style: TextStyle(
                  color: StudentUi.of(context).muted,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                ),
              ),
              const SizedBox(height: 8),
              if (_error != null)
                StudentErrorBanner(message: _error!)
              else if (_cards.isEmpty)
                const StudentEmptyState(
                  icon: TablerIcons.layoutGrid,
                  message:
                      'No published Bingo cards yet. Check back when an organization publishes one.',
                )
              else ...[
                if (_cards.length > 1) ...[
                  Text(
                    'Choose a bingo card',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
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
                          if (value != null) _selectCard(value);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (_board == null)
                  const StudentEmptyState(
                    icon: TablerIcons.layoutGrid,
                    message: 'This bingo card is no longer available.',
                  )
                else ...[
                  Text(
                    _board!.title,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontSize: 27,
                      color: Theme.of(context).colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    '${_board!.completedCellIds.length} / ${_board!.cells.length} completed | ${_board!.seasonLabel}',
                    style: TextStyle(
                      color: StudentUi.of(context).muted,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _Metric(
                          label: 'Event streak',
                          value: '${_board!.streak}',
                          color: Theme.of(context).colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _Metric(
                          label: 'Lines complete',
                          value: '${_board!.completedLines.length}',
                          color: Theme.of(context).colorScheme.tertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AspectRatio(
                    aspectRatio: 1,
                    child: Container(
                      padding: const EdgeInsets.all(2),
                      color: Theme.of(context).colorScheme.outline,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: 9,
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  crossAxisSpacing: 2,
                                  mainAxisSpacing: 2,
                                ),
                            itemBuilder: (context, position) {
                              final cell = _board!.cells
                                  .cast<BingoCellView?>()
                                  .firstWhere(
                                    (c) => c?.position == position,
                                    orElse: () => null,
                                  );
                              final done =
                                  cell != null &&
                                  _board!.completedCellIds.contains(cell.id);
                              return Container(
                                padding: const EdgeInsets.all(8),
                                color: done
                                    ? Theme.of(
                                        context,
                                      ).colorScheme.tertiaryContainer
                                    : Theme.of(context).colorScheme.surface,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      cell?.eventTitle ??
                                          cell?.label ??
                                          'Empty',
                                      textAlign: TextAlign.center,
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: done
                                            ? Theme.of(
                                                context,
                                              ).colorScheme.onTertiaryContainer
                                            : Theme.of(
                                                context,
                                              ).colorScheme.onSurface,
                                      ),
                                    ),
                                    if (done)
                                      Padding(
                                        padding: EdgeInsets.only(top: 5),
                                        child: Icon(
                                          TablerIcons.circleCheck,
                                          size: 17,
                                          color: Theme.of(
                                            context,
                                          ).colorScheme.tertiary,
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            },
                          ),
                          IgnorePointer(
                            child: CustomPaint(
                              painter: _CompletedLinesPainter(
                                lines: _board!.completedLines,
                                color: Theme.of(context).colorScheme.tertiary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Icon(
                        TablerIcons.award,
                        size: 19,
                        color: Theme.of(context).colorScheme.tertiary,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Recognition earned',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.onSurface,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_board!.awards.isEmpty)
                    Text(
                      'Complete a line or streak on this card to earn badges.',
                      style: TextStyle(color: StudentUi.of(context).muted),
                    )
                  else
                    ..._board!.awards.map(
                      (award) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _AwardRow(
                          name: award.name,
                          points: award.points,
                        ),
                      ),
                    ),
                ],
              ],
            ],
          ),
  );
}

class _CompletedLinesPainter extends CustomPainter {
  final List<List<int>> lines;
  final Color color;

  const _CompletedLinesPainter({required this.lines, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.75)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    for (final line in lines) {
      final start = line.first;
      final end = line.last;
      canvas.drawLine(
        Offset(
          size.width * ((start % 3) + 0.5) / 3,
          size.height * ((start ~/ 3) + 0.5) / 3,
        ),
        Offset(
          size.width * ((end % 3) + 0.5) / 3,
          size.height * ((end ~/ 3) + 0.5) / 3,
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CompletedLinesPainter oldDelegate) =>
      lines != oldDelegate.lines || color != oldDelegate.color;
}

class _Metric extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _Metric({
    required this.label,
    required this.value,
    required this.color,
  });
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      border: Border.all(color: StudentUi.of(context).border),
    ),
    child: Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: StudentUi.of(context).muted),
        ),
      ],
    ),
  );
}

class _AwardRow extends StatelessWidget {
  final String name;
  final int points;
  const _AwardRow({required this.name, required this.points});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
    decoration: BoxDecoration(
      color: Theme.of(context).colorScheme.surface,
      border: Border.all(color: StudentUi.of(context).border),
    ),
    child: Row(
      children: [
        Icon(
          TablerIcons.stars,
          color: Theme.of(context).colorScheme.tertiary,
          size: 18,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            name,
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        Text(
          '+$points',
          style: TextStyle(
            color: Theme.of(context).colorScheme.tertiary,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    ),
  );
}
