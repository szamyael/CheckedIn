import 'package:flutter/material.dart';

class PasswordRequirements extends StatelessWidget {
  final String value;

  const PasswordRequirements({super.key, required this.value});

  List<Map<String, Object>> get _rules => [
        {
          'label': 'Special characters',
          'met': RegExp(r'[^A-Za-z0-9]').hasMatch(value),
        },
        {
          'label': 'At least 2 numbers',
          'met': RegExp(r'\d').allMatches(value).length >= 2,
        },
        {'label': 'One uppercase', 'met': RegExp(r'[A-Z]').hasMatch(value)},
        {'label': '8 password length', 'met': value.length >= 8},
      ];

  @override
  Widget build(BuildContext context) {
    final rules = _rules;
    final strength = rules.where((rule) => rule['met'] == true).length;
    final labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    final colors = [
      Theme.of(context).colorScheme.outlineVariant,
      Colors.red,
      Colors.orange,
      Colors.blue,
      Colors.green,
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: rules.map((rule) {
              final met = rule['met'] == true;
              return Chip(
                label: Text('${met ? '✓ ' : ''}${rule['label']}'),
                labelStyle: TextStyle(
                  fontSize: 11,
                  color: met
                      ? Colors.green.shade700
                      : Theme.of(context).colorScheme.onSurfaceVariant,
                ),
                backgroundColor: met
                    ? Colors.green.shade50
                    : Theme.of(context).colorScheme.surfaceContainerHighest,
                side: BorderSide(
                  color: met
                      ? Colors.green.shade200
                      : Theme.of(context).colorScheme.outlineVariant,
                ),
                visualDensity: VisualDensity.compact,
                padding: EdgeInsets.zero,
              );
            }).toList(),
          ),
          if (value.isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Row(
                    children: List.generate(
                      4,
                      (index) => Expanded(
                        child: Container(
                          height: 6,
                          margin: EdgeInsets.only(right: index == 3 ? 0 : 4),
                          decoration: BoxDecoration(
                            color: index < strength
                                ? colors[strength]
                                : Theme.of(context)
                                    .colorScheme
                                    .outlineVariant,
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  labels[strength],
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
