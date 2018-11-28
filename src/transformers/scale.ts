/// <reference path="../node_modules/tns-platform-declarations/android.d.ts" />
import { CarouselCommon } from '..';

@Interfaces([android.support.v4.view.ViewPager.PageTransformer])
export class ScaleTransformer extends java.lang.Object implements android.support.v4.view.ViewPager.PageTransformer {
  private static MIN_SCALE = 0.8;
  private static MAX_SCALE = 1.0;

  constructor(public owner: CarouselCommon) {
    super();
    return global.__native(this);
  }

  transformPage(view: android.view.View, position: number) {
    position = position < -1 ? -1 : position;
    position = position > 1 ? 1 : position;
    const tempScale = position < 0 ? 1 + position : 1 - position;
    const slope = (ScaleTransformer.MAX_SCALE - ScaleTransformer.MIN_SCALE) / 1;
    const scaleValue = ScaleTransformer.MIN_SCALE + tempScale * slope;
    view.setScaleX(scaleValue);
    view.setScaleY(scaleValue);
  }
}
