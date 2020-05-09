export class BeatAnalyzer {
  constructor(bucketNumber) {
    this.bucketsNumber = bucketNumber;
    this.values = new Array(bucketNumber).fill(0);
    this.mildlySmoothedValues = new Array(bucketNumber).fill(0);
    this.smoothedValues = new Array(bucketNumber).fill(0);
    this.smoothedVariances = new Array(bucketNumber).fill(0);
    this.beats = new Array(bucketNumber).fill(0);
    this.clampedBeats = new Array(bucketNumber).fill(0);
  }

  updateWithFrequencies(frequencies) {
    const bucketLength = Math.floor(frequencies.length / this.bucketsNumber);

    this.values.forEach((_, i) => {
      let sum = 0;
      for (let j = 0; j < bucketLength; j++) {
        sum += frequencies[i * bucketLength + j];
      }
      this.values[i] = sum / bucketLength;
    });

    this.values.forEach((value, i) => {
      const mildlySmoothedValue = smooth(this.mildlySmoothedValues[i], value, 4);
      this.mildlySmoothedValues[i] = mildlySmoothedValue;
      this.smoothedValues[i] = smooth(this.smoothedValues[i], value, 100);
      const deltaToSmoothedValue = mildlySmoothedValue - this.smoothedValues[i];
      const beat = deltaToSmoothedValue / this.smoothedVariances[i];
      this.smoothedVariances[i] = smooth(this.smoothedVariances[i], Math.abs(deltaToSmoothedValue), 100);
      this.beats[i] = beat;
      this.clampedBeats[i] = clamp(0, 2, beat) / 2;
    });
  }
}

function clamp(min, max, value) {
  return Math.min(Math.max(value, min), max);
}

function smooth(oldValue, value, smoothness) {
  return (oldValue * (smoothness - 1) + value) / smoothness;
}
