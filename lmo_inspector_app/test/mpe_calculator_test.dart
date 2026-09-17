import 'package:flutter_test/flutter_test.dart';
import 'package:lmo_inspector_app/services/mpe_calculator_service.dart';

void main() {
  group('Statutory MPE Calculator (Schedule VII / OIML R76)', () {
    test('resolveClass correctly maps instrument type strings to metrological classes', () {
      expect(MpeCalculatorService.resolveClass('Analytical Micro Balance'), MetrologyAccuracyClass.classI);
      expect(MpeCalculatorService.resolveClass('Commercial Gold Scale'), MetrologyAccuracyClass.classII);
      expect(MpeCalculatorService.resolveClass('Retail Counter Scale'), MetrologyAccuracyClass.classIII);
      expect(MpeCalculatorService.resolveClass('Industrial Weighbridge Truck Scale'), MetrologyAccuracyClass.classIV);
      expect(MpeCalculatorService.resolveClass('Unknown Platform'), MetrologyAccuracyClass.classIII);
    });

    test('Class III initial verification tolerances follow statutory step function (0.5e, 1.0e, 1.5e)', () {
      // 0 <= m <= 500 e -> 0.5 e
      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 200,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.initialVerification,
        ),
        0.5,
      );

      // 500 < m <= 2000 e -> 1.0 e
      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 1500,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.initialVerification,
        ),
        1.0,
      );

      // m > 2000 e -> 1.5 e
      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 5000,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.initialVerification,
        ),
        1.5,
      );
    });

    test('Subsequent reverification doubles the allowable tolerance (Rule 14(4))', () {
      // Class III subsequent: 0.5e * 2 = 1.0e, 1.0e * 2 = 2.0e, 1.5e * 2 = 3.0e
      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 200,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.subsequentReverification,
        ),
        1.0,
      );

      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 1500,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.subsequentReverification,
        ),
        2.0,
      );

      expect(
        MpeCalculatorService.getAllowableMpeInDivisions(
          loadInDivisions: 5000,
          accuracyClass: MetrologyAccuracyClass.classIII,
          verificationType: VerificationType.subsequentReverification,
        ),
        3.0,
      );
    });

    test('evaluateReading accurately detects in-tolerance and breach conditions', () {
      // 500g test load with e = 1g -> m = 500e -> initial MPE = 0.5g
      final passResult = MpeCalculatorService.evaluateReading(
        standardWeight: 500.0,
        observedReading: 500.4,
        verificationIntervalE: 1.0,
        accuracyClass: MetrologyAccuracyClass.classIII,
        verificationType: VerificationType.initialVerification,
        stepLabel: 'Half Load Test',
      );

      expect(passResult.isWithinTolerance, isTrue);
      expect(passResult.error, closeTo(0.4, 0.001));
      expect(passResult.allowableMpe, 0.5);
      expect(passResult.excessDeviation, 0.0);

      // Exceeding tolerance: observed 500.8g -> error 0.8g > 0.5g
      final failResult = MpeCalculatorService.evaluateReading(
        standardWeight: 500.0,
        observedReading: 500.8,
        verificationIntervalE: 1.0,
        accuracyClass: MetrologyAccuracyClass.classIII,
        verificationType: VerificationType.initialVerification,
        stepLabel: 'Half Load Test',
      );

      expect(failResult.isWithinTolerance, isFalse);
      expect(failResult.error, closeTo(0.8, 0.001));
      expect(failResult.excessDeviation, closeTo(0.3, 0.001));
    });

    test('parseErrorString safely extracts numbers from formatted text', () {
      expect(MpeCalculatorService.parseErrorString('+0.5 g'), 0.5);
      expect(MpeCalculatorService.parseErrorString('-1.2 kg'), -1.2);
      expect(MpeCalculatorService.parseErrorString('0.0'), 0.0);
      expect(MpeCalculatorService.parseErrorString(''), 0.0);
    });
  });
}
