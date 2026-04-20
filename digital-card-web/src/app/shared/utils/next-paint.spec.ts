import { nextPaint } from './next-paint';

describe('nextPaint', () => {
  it('resolves after two animation frames', async () => {
    const spy = spyOn(window, 'requestAnimationFrame').and.callFake((cb: FrameRequestCallback) => {
      cb(0);
      return 1 as unknown as number;
    });
    await nextPaint();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
