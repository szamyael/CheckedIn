import 'package:flutter/material.dart';

import '../../services/bingo_service.dart';

class BingoScreen extends StatefulWidget {
  const BingoScreen({super.key});

  @override
  State<BingoScreen> createState() => _BingoScreenState();
}

class _BingoScreenState extends State<BingoScreen> {
  final _service = BingoService();
  late Future<BingoBoardData?> _future;

  @override
  void initState() {
    super.initState();
    _future = _service.fetchActiveBoard();
  }

  Future<void> _refresh() async {
    setState(() => _future = _service.fetchActiveBoard());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<BingoBoardData?>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          final board = snapshot.data;
          if (board == null) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: const [
                SizedBox(height: 80),
                Icon(Icons.grid_view_rounded, size: 56, color: Colors.grey),
                SizedBox(height: 16),
                Text(
                  'No active bingo card yet.\nCheck back when an organization publishes one.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.black54),
                ),
              ],
            );
          }

          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                board.title,
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Season ${board.seasonLabel} · Streak goal ${board.streakThreshold}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.black54,
                    ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _MetricCard(
                      label: 'Event streak',
                      value: '${board.streak}',
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _MetricCard(
                      label: 'Line complete',
                      value: board.hasLine ? 'Yes' : 'No',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: 9,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemBuilder: (context, position) {
                  BingoCellView? cell;
                  for (final c in board.cells) {
                    if (c.position == position) {
                      cell = c;
                      break;
                    }
                  }
                  final done =
                      cell != null && board.completedCellIds.contains(cell.id);
                  final title =
                      cell?.eventTitle ?? cell?.label ?? 'Empty';
                  return Container(
                    decoration: BoxDecoration(
                      color: done
                          ? Theme.of(context).colorScheme.primary.withValues(
                                alpha: 0.12,
                              )
                          : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: done
                            ? Theme.of(context).colorScheme.primary
                            : Colors.black12,
                      ),
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: done
                                ? Theme.of(context).colorScheme.primary
                                : Colors.black87,
                          ),
                        ),
                        if (done) ...[
                          const SizedBox(height: 4),
                          Icon(
                            Icons.check_circle,
                            size: 16,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),
              Text(
                'Your org badges',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              if (board.awards.isEmpty)
                const Text(
                  'Complete a line or streak to earn badges.',
                  style: TextStyle(color: Colors.black45),
                )
              else
                ...board.awards.map(
                  (a) => Card(
                    child: ListTile(
                      title: Text(a.name),
                      trailing: Text(
                        '+${a.points}',
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;

  const _MetricCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}
