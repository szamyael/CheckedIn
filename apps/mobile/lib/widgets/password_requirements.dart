import 'package:flutter/material.dart';

import 'student_ui.dart';

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
    final theme = Theme.of(context);
    final studentUi = StudentUi.of(context);
    final rules = _rules;
    final strength = rules.where((rule) => rule['met'] == true).length;
    final labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    final colors = [
      theme.colorScheme.outlineVariant,
      theme.colorScheme.error,
      theme.colorScheme.tertiary,
      theme.colorScheme.secondary,
      studentUi.success,
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
                      ? studentUi.success
                      : theme.colorScheme.onSurfaceVariant,
                ),
                backgroundColor: met
                    ? studentUi.successSurface
                    : theme.colorScheme.surfaceContainerHighest,
                side: BorderSide(
                  color: met
                      ? studentUi.successBorder
                      : theme.colorScheme.outlineVariant,
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
                                : theme.colorScheme.outlineVariant,
                            borderRadius: BorderRadius.circular(99),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(labels[strength], style: theme.textTheme.bodySmall),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
