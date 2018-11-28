/// <reference path="./node_modules/tns-platform-declarations/ios.d.ts" />
/// <reference path="./objc!DKCarouselView.d.ts" />

import { screen } from 'tns-core-modules/platform';
import { parse } from 'tns-core-modules/ui/builder';
import { isNullOrUndefined, isNumber } from 'tns-core-modules/utils/types';
import {
  autoPagingIntervalProperty,
  bounceProperty,
  CarouselCommon,
  CarouselItem,
  finiteProperty,
  indicatorColorProperty,
  indicatorColorUnselectedProperty,
  indicatorOffsetProperty,
  scrollEnabledProperty,
  selectedPageProperty,
  showIndicatorProperty,
  CLog,
  CLogTypes
} from './index.common';

export * from './index.common';

export class Carousel extends CarouselCommon {
  public nativeView;
  public items;
  public itemTemplate;
  public selectedPage;
  private _isDirty: boolean;

  constructor() {
    super();
  }

  get ios(): any {
    return this.nativeView;
  }

  [autoPagingIntervalProperty.setNative](value) {
    if (this.nativeView instanceof DKCarouselView) {
      this.nativeView.setAutoPagingForInterval(value);
    }
  }

  [selectedPageProperty.setNative](value) {
    this.selectedPage = value;
    this.nativeView.selectedPage = value;
  }

  [showIndicatorProperty.setNative](value) {
    this.nativeView.indicatorIsVisible = value;
  }

  [finiteProperty.setNative](value) {
    this.nativeView.finite = value;
  }

  [bounceProperty.setNative](value) {
    this.nativeView.bounce = value;
  }

  [scrollEnabledProperty.setNative](value) {
    this.nativeView.scrollEnabled = value;
  }

  [indicatorColorProperty.setNative](value) {
    this.nativeView.indicatorTintColor = value ? value.ios : '#fff';
  }

  [indicatorColorUnselectedProperty.setNative](value) {
    this.nativeView.indicatorTintColorUnselected = value.ios;
  }

  [indicatorOffsetProperty.setNative](value) {
    const ar = value.split(',');
    const x = ar[0] ? ar[0] : 0;
    const y = ar[1] ? ar[1] : 0;
    this.nativeView.indicatorOffset = CGPointMake(x, y);
  }

  createNativeView() {
    this.nativeView = new DKCarouselView(
      UIView.alloc().initWithFrame(CGRectMake(0, 0, screen.mainScreen.widthDIPs, 0))
    );

    return this.nativeView;
  }

  initNativeView() {
    CLog(CLogTypes.info, `initNativeView...`, this.nativeView);
    const nativeView = this.nativeView;
    this._isDirty = true;

    nativeView.setDidSelectBlock((item, index) => {
      const data = {
        eventName: CarouselCommon.pageTappedEvent,
        object: this,
        view: item,
        index: index
      };
      this.notify(data);
    });

    nativeView.setDidChangeBlock((view, index) => {
      const data = {
        eventName: CarouselCommon.pageChangedEvent,
        object: this,
        view: view,
        index: index
      };
      this.selectedPage = index;
      this.notify(data);
    });

    nativeView.setDidScrollBlock((view, offset) => {
      const data = {
        eventName: CarouselCommon.pageScrollingEvent,
        object: this,
        view: view,
        state: {
          offset: offset
        }
      };
      this.notify(data);
    });
  }

  disposeNativeView() {
    const nativeView = this.nativeView;
    nativeView.setDidChangeBlock(null);
    nativeView.setDidScrollBlock(null);
    nativeView.setDidSelectBlock(null);
    nativeView.setItems(NSMutableArray.new());
    this.removeChildren();
  }

  onLoaded() {
    CLog(CLogTypes.info, `onLoaded...`);
    super.onLoaded();

    if (this._isDirty) {
      this.refresh();
    }
  }

  refresh() {
    CLog(CLogTypes.info, `refresh...`);
    if (!this.isLoaded || !this.nativeView) {
      this._isDirty = true;
      return;
    }
    this._isDirty = false;
    this.nativeView.setItems(NSMutableArray.new());

    if (isNullOrUndefined(this.items) || !isNumber(this.items.length)) {
      const nsArray = NSMutableArray.new();
      CLog(CLogTypes.info, `children count: `, this.getChildrenCount());

      const screenWidth = screen.mainScreen.widthPixels;
      console.log('screenWidth', screenWidth);

      this.eachChildView(view1 => {
        if (view1 instanceof CarouselItem) {
          console.log('view1', view1);
          view1.horizontalAlignment = 'center';

          view1.height = this.height;
          view1.width = this.width;

          if (this.peekOffscreenItems) {
            console.log('setting the peek for offscreen items');

            view1.width = { value: 200, unit: 'px' };
            // view1.paddingRight = { value: screenWidth * 0.15, unit: 'dip' };
            // view1.paddingLeft = { value: screenWidth * 0.15, unit: 'dip' };
            // view1.marginRight = { value: screenWidth * 0.15, unit: 'dip' };
            // view1.marginLeft = { value: screenWidth * 0.15, unit: 'dip' };
            // view1.effectivePaddingLeft = 50;
            // view1.effectivePaddingRight = 50;
          }

          const dkCarouselViewItem1 = new DKCarouselViewItem();

          const insets = new UIEdgeInsets();
          insets.left = 20;
          insets.right = 20;

          (dkCarouselViewItem1 as UIScrollView).layoutMargins = insets;
          // (dkCarouselViewItem1 as UIView)
          // (dkCarouselViewItem1 as UIView).autoresizingMask = UIViewAutoresizing.FlexibleRightMargin;
          dkCarouselViewItem1.view = view1.ios;
          nsArray.addObject(dkCarouselViewItem1);
        }
        return true;
      });
      this.nativeView.setItems(nsArray);
    } else {
      this.removeChildren();

      const nsArray = NSMutableArray.new();
      const length = this.items.length;
      CLog(CLogTypes.info, `items length: `, length);

      for (let i = 0; i < length; i++) {
        const viewToAdd = !isNullOrUndefined(this.itemTemplate) ? parse(this.itemTemplate, this) : null;
        if (!viewToAdd) continue;
        const dataItem = this._getDataItem(i);
        viewToAdd.bindingContext = dataItem;
        this.addChild(viewToAdd);
      }

      this.eachChildView(view => {
        if (view instanceof CarouselItem) {
          view.width = this.width;
          view.height = this.height;
          const dkCarouselViewItem = new DKCarouselViewItem();
          dkCarouselViewItem.view = view.ios;
          nsArray.addObject(dkCarouselViewItem);
        }
        return true;
      });
      this.nativeView.setItems(nsArray);
    }
  }

  public onItemsChanged(data) {
    if (!isNullOrUndefined(this.items) && isNumber(this.items.length)) {
      this.refresh();
    }
  }

  private _getDataItem(index) {
    return this.items.getItem ? this.items.getItem(index) : this.items[index];
  }
}
