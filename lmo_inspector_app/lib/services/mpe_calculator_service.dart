/// Legal Metrology (General) Rules, 2011 - Schedule VII & OIML R76
/// Automated Maximum Permissible Error (MPE) Evaluation Service.
///
/// Implements statutory tolerance brackets for Non-Automatic Weighing Instruments (NAWI):
/// - Class I (Special Precision): Analytical balances in gold / forensic / medical labs
/// - Class II (High Precision): Commercial gold / pharmaceutical scales
/// - Class III (Medium Precision): Standard retail, grocery counter, and platform scales
/// - Class IV (Ordinary Precision): Heavy industrial weighbridges, bulk commodity yard scales
library;

enum MetrologyAccuracyClass {
  classI,
  classII,
  classIII,
  classIV,
}

enum VerificationType {
  initialVerification, // Stamping at factory or initial installation (tightest MPE)
  subsequentReverification, // Routine annual field inspection / reverification (in-service MPE = 2x initial)
}

class MpeEvaluationResult {
  final double standardWeight;
  final double observedReading;
  final double error; // observed - standard
  final double allowableMpe; // maximum permissible error (+/-)
  final bool isWithinTolerance;
  final String stepDescription;
  final String formattedTolerance;

  const MpeEvaluationResult({
    required this.standardWeight,
    required this.observedReading,
    required this.error,
    required this.allowableMpe,
    required this.isWithinTolerance,
    required this.stepDescription,
    required this.formattedTolerance,
  });

  double get absoluteError => error.abs();
  double get excessDeviation => isWithinTolerance ? 0.0 : (absoluteError - allowableMpe);
}

class MpeCalculatorService {
  /// Resolves the accuracy class from instrument type string
  static MetrologyAccuracyClass resolveClass(String instrumentType) {
    final lower = instrumentType.toLowerCase();
    if (lower.contains('analytical') || lower.contains('micro') || lower.contains('class i\b')) {
      return MetrologyAccuracyClass.classI;
    }
    if (lower.contains('precision') || lower.contains('gold') || lower.contains('jewel') || lower.contains('class ii\b')) {
      return MetrologyAccuracyClass.classII;
    }
    if (lower.contains('weighbridge') || lower.contains('truck') || lower.contains('class iv\b')) {
      return MetrologyAccuracyClass.classIV;
    }
    // Default to Class III (Standard Commercial Counter / Platform Scale)
    return MetrologyAccuracyClass.classIII;
  }

  /// Calculates dynamic Statutory Risk Index (SRI) 0-100 for any trader record
  static Map<String, dynamic> calculateSriScore({
    required String instrumentType,
    required String licenseNumber,
    int? explicitRiskScore,
    String? explicitRiskTier,
    int? explicitComplaints,
  }) {
    if (explicitRiskScore != null && explicitRiskScore > 20) {
      return {
        'score': explicitRiskScore,
        'tier': explicitRiskTier ??
            (explicitRiskScore >= 70
                ? 'CRITICAL'
                : explicitRiskScore >= 40
                    ? 'MODERATE'
                    : 'LOW'),
        'complaints': explicitComplaints ?? 0,
      };
    }

    final lower = instrumentType.toLowerCase();
    int categoryRisk = 15;
    if (lower.contains('weighbridge') ||
        lower.contains('truck') ||
        lower.contains('petrol') ||
        lower.contains('fuel')) {
      categoryRisk = 30;
    } else if (lower.contains('gold') ||
        lower.contains('precision') ||
        lower.contains('jewel') ||
        lower.contains('analytical')) {
      categoryRisk = 26;
    } else if (lower.contains('platform') ||
        lower.contains('grain') ||
        lower.contains('depot') ||
        lower.contains('flour')) {
      categoryRisk = 22;
    } else {
      categoryRisk = 12;
    }

    // Deterministic pseudo-recency score based on license hash
    int hash = 0;
    for (int i = 0; i < licenseNumber.length; i++) {
      hash = (hash * 31 + licenseNumber.codeUnitAt(i)) & 0x7FFFFFFF;
    }
    final recencyRisk = 10 + (hash % 20);

    // Complaints calculation: high risk categories receive active citizen complaints
    int complaints = 0;
    if (categoryRisk >= 26 || (hash % 4 == 0)) {
      complaints = 1 + (hash % 3);
    }
    final complaintRisk = (complaints * 10).clamp(0, 20);

    final historyRisk = (hash % 5 == 0) ? 15 : 5;

    final totalScore =
        (categoryRisk + recencyRisk + complaintRisk + historyRisk).clamp(15, 95);
    final tier =
        totalScore >= 65 ? 'CRITICAL' : totalScore >= 40 ? 'MODERATE' : 'LOW';

    return {
      'score': totalScore,
      'tier': tier,
      'complaints': complaints,
    };
  }

  /// Calculates the Statutory Allowable MPE (in scale divisions 'e')
  /// based on test load expressed in scale intervals (m = load / e).
  ///
  /// Legal Metrology (General) Rules 2011 Schedule VII Table 1:
  /// For Class III instruments:
  /// - 0 <= m <= 500 e: MPE = +/- 0.5 e (Initial) / +/- 1.0 e (Re-verification)
  /// - 500 e < m <= 2000 e: MPE = +/- 1.0 e (Initial) / +/- 2.0 e (Re-verification)
  /// - 2000 e < m <= 10000 e: MPE = +/- 1.5 e (Initial) / +/- 3.0 e (Re-verification)
  static double getAllowableMpeInDivisions({
    required double loadInDivisions,
    MetrologyAccuracyClass accuracyClass = MetrologyAccuracyClass.classIII,
    VerificationType verificationType = VerificationType.subsequentReverification,
  }) {
    final m = loadInDivisions.abs();
    double baseMpe;

    switch (accuracyClass) {
      case MetrologyAccuracyClass.classI:
        if (m <= 50000) {
          baseMpe = 0.5;
        } else if (m <= 200000) {
          baseMpe = 1.0;
        } else {
          baseMpe = 1.5;
        }
        break;

      case MetrologyAccuracyClass.classII:
        if (m <= 5000) {
          baseMpe = 0.5;
        } else if (m <= 20000) {
          baseMpe = 1.0;
        } else {
          baseMpe = 1.5;
        }
        break;

      case MetrologyAccuracyClass.classIII:
      case MetrologyAccuracyClass.classIV:
        if (m <= 500) {
          baseMpe = 0.5;
        } else if (m <= 2000) {
          baseMpe = 1.0;
        } else {
          baseMpe = 1.5;
        }
        break;
    }

    // In-service re-verification permits 2x initial verification tolerance under Rule 14(4)
    if (verificationType == VerificationType.subsequentReverification) {
      return baseMpe * 2.0;
    }
    return baseMpe;
  }

  /// Evaluates a specific test point reading against statutory MPE
  static MpeEvaluationResult evaluateReading({
    required double standardWeight,
    required double observedReading,
    double verificationIntervalE = 1.0, // in same units as standard weight (e.g. grams)
    MetrologyAccuracyClass accuracyClass = MetrologyAccuracyClass.classIII,
    VerificationType verificationType = VerificationType.subsequentReverification,
    String stepLabel = 'Load Test',
  }) {
    final error = observedReading - standardWeight;
    final loadInDivisions = verificationIntervalE > 0 ? (standardWeight / verificationIntervalE) : standardWeight;
    final mpeInE = getAllowableMpeInDivisions(
      loadInDivisions: loadInDivisions,
      accuracyClass: accuracyClass,
      verificationType: verificationType,
    );

    final allowableMpeWeight = mpeInE * verificationIntervalE;
    final isWithin = error.abs() <= (allowableMpeWeight + 1e-9);

    return MpeEvaluationResult(
      standardWeight: standardWeight,
      observedReading: observedReading,
      error: error,
      allowableMpe: allowableMpeWeight,
      isWithinTolerance: isWithin,
      stepDescription: stepLabel,
      formattedTolerance: '±${allowableMpeWeight.toStringAsFixed(1)}g (±${mpeInE.toStringAsFixed(1)}e)',
    );
  }

  /// Parse user numeric string like "+0.5 g", "-1.2", "0.0" into double
  static double parseErrorString(String text) {
    if (text.trim().isEmpty) return 0.0;
    final clean = text.replaceAll(RegExp(r'[^0-9.-]'), '');
    return double.tryParse(clean) ?? 0.0;
  }
}
