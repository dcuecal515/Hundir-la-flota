import { Component,HostListener, ViewChild,ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  currentOpacity1: number=0
  currentOpacity2: number=0
  currentOpacity3: number=0
  currentOpacity4: number=0
  curretTop: string = "80%"
  @ViewChild('rule1', { static: true }) rule1!: ElementRef;
  @ViewChild('rule2', { static: true }) rule2!: ElementRef;
  @ViewChild('rule3', { static: true }) rule3!: ElementRef;
  @ViewChild('rule4', { static: true }) rule4!: ElementRef;
  @HostListener('window:scroll', [])
  checkScroll(){
    const currentScroll = window.scrollY;
    /*if(currentScroll<400){
      this.ship.nativeElement.style.top = this.curretTop;
    }else{
      this.ship.nativeElement.style.top = "80%";
    }*/
   if(screen.width<=500){
    this.rule1.nativeElement.style.opacity='1'
    this.rule2.nativeElement.style.opacity='1'
    this.rule3.nativeElement.style.opacity='1'
    this.rule4.nativeElement.style.opacity='1'
   }else{
    if(currentScroll>250 && this.rule1.nativeElement.style.opacity !== ('1')){
      this.currentOpacity1+=0.05;
      this.rule1.nativeElement.style.opacity = this.currentOpacity1.toString();
    }
    if(currentScroll>500 && this.rule2.nativeElement.style.opacity !== ('1')){
      this.currentOpacity2+=0.05;
      this.rule2.nativeElement.style.opacity = this.currentOpacity2.toString();
    }
    if(currentScroll>750 && this.rule3.nativeElement.style.opacity !== ('1')){
      this.currentOpacity3+=0.05;
      this.rule3.nativeElement.style.opacity = this.currentOpacity3.toString();
    }
    if(currentScroll>1100 && this.rule4.nativeElement.style.opacity !== ('1')){
      this.currentOpacity4+=0.05;
      this.rule4.nativeElement.style.opacity = this.currentOpacity4.toString();
    }
  }
  }
}
