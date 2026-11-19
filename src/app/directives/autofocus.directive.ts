import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/**
 * Custom attribute directive: puts the keyboard cursor in this element as soon
 * as the page opens, e.g. <input appAutofocus>. Helps keyboard and
 * screen-reader users because they can start typing straight away.
 */
@Directive({ selector: '[appAutofocus]' })
export class Autofocus implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    this.el.nativeElement.focus();
  }
}
