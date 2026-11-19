import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Autofocus } from './autofocus.directive';

@Component({
  imports: [Autofocus],
  template: `<input id="first" /><input id="second" appAutofocus />`,
})
class HostComponent {}

describe('Autofocus directive', () => {
  it('puts the cursor in the element it is attached to', () => {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement); // focus only works inside the page
    fixture.detectChanges();
    const second = (fixture.nativeElement as HTMLElement).querySelector('#second');
    expect(document.activeElement).toBe(second);
    fixture.nativeElement.remove();
  });
});
