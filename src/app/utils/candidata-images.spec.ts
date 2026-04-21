import { getDefaultCandidataImage, resolveCandidataImage } from './candidata-images';

describe('candidata-images utils', () => {
  it('should return the explicit image url when provided', () => {
    expect(resolveCandidataImage('https://cdn.example.com/image.jpg', 'belleza', 7, 'belleza')).toBe(
      'https://cdn.example.com/image.jpg'
    );
  });

  it('should build the fallback image path from candidata data', () => {
    expect(resolveCandidataImage('', 'adulta', 12, 'calle')).toBe(
      'https://staticfoguerapp.hogueras.es/CANDIDATAS/calle/adulta/12.jpg'
    );
  });

  it('should return the default image when candidata data is incomplete', () => {
    expect(resolveCandidataImage('', undefined, 12, 'belleza')).toBe(getDefaultCandidataImage());
    expect(resolveCandidataImage('', 'adulta', undefined, 'belleza')).toBe(getDefaultCandidataImage());
  });
});
