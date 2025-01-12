import { Component,HostListener, ViewChild,ElementRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  currentOpacity: number=0
  @ViewChild('rule1', { static: true }) rule1!: ElementRef;
  @HostListener('window:scroll', [])
  checkScroll(){
    const currentScroll = window.scrollY;
    if(currentScroll>400 && this.rule1.nativeElement.style.opacity !== ('1')){
      this.currentOpacity+=0.02;
      this.rule1.nativeElement.style.opacity = this.currentOpacity.toString();
    }
  }
}
