import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private BASE_URL=environment.apiUrl;

  constructor() {}
}
