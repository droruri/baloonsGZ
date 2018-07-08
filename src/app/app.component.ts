import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import { Store } from '@ngrx/store';
import { IAppState } from './store';
import { USER_GET } from './store/profile/profile.actions';
import { ISimpleResponse } from './shared/interfaces/simple.interface';

declare var $: any

@Component({
  moduleId: module.id + "",
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './bootstrap.min.css']
})
export class AppComponent implements OnInit {
  @ViewChild('video') video: any
  @ViewChild('gpsLongtitude') gpsLongtitude: any
  @ViewChild('gpsLatitude') gpsLatitude: any
  location = {};
  observable$: Observable<ISimpleResponse>
  canvas: HTMLCanvasElement
  _window: any
  phoneModal: any
  userPhoneNumber: string = localStorage.getItem('userPhoneNumber')
  fileToUpload: File = null
  description: string = ''
  azimuthWhenCapturing: number = 0
  currAzimuth: number = 0
  isRelativeAzimuth: boolean = false

  constructor(private http: HttpClient, private store: Store<IAppState>) { }

  ngOnInit() {
    this._window = window
    this.currAzimuth = 0
  }

  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  //TODO: upload file with accepted format
  uploadFileToActivity() {
    this.http.post('', this.fileToUpload).subscribe(data => {
      // do something, if upload success
    }, error => {
      console.log(error);
    });
  }

  checkLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(((position) => {
        document.getElementById("gpsLongtitude").innerText = position.coords.longitude.toString()
        document.getElementById("gpsLatitude").innerText = position.coords.latitude.toString()
        console.log(position.coords);
      }), (error) => {
        var gpsElement = document.getElementById("gpsLongtitude")
        switch (error.code) {
          case error.PERMISSION_DENIED:
            gpsElement.innerHTML = "User denied the request for Geolocation."
            this.checkLocation()
            break;
          case error.POSITION_UNAVAILABLE:
            gpsElement.innerHTML = "Location information is unavailable."
            break;
          case error.TIMEOUT:
            gpsElement.innerHTML = "The request to get user location timed out."
            break;
        }
      })
    }
  }

  ngAfterViewInit() {
    this.initModal()
  }

  startUseCamera() {
    let _video = this.video.nativeElement;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          _video.src = window.URL.createObjectURL(stream);
          _video.play();
        })
    }
  }

  savePhoneNumber() {
    localStorage.setItem('userPhoneNumber', this.userPhoneNumber)
    this.startUseCamera()
    this.checkLocation()
    this.checkNorth()

    $('#phoneModal').modal('hide')
  }

  initModal() {
    this.phoneModal = document.getElementById('phoneModal')

    if (!this.userPhoneNumber) {
      this.displayModal()
    } else {
      this.startUseCamera()
      this.checkLocation()
      this.checkNorth()
    }
  }

  displayModal() {
    $('#phoneModal').modal({ backdrop: 'static', keyboard: false })
  }

  capture() {
    const img = document.getElementById('image');
    const video = document.querySelector('video');

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    img.setAttribute("src", canvas.toDataURL('image/webp'));
    img.style.width="75%"
    img.style.height="75%"

    $('#imageModal').modal('show')
  }

  upload() {
    $('#imageModal').modal('hide')
    window.alert('uploading image. thank you!')
    console.log('uploaded')
  }

  checkNorth() {
    // Check if device can provide absolute orientation data
    if ('DeviceOrientationAbsoluteEvent' in window) {
      window.addEventListener("DeviceOrientationAbsoluteEvent", (event: any) => {
        this.deviceOrientationHandler(event)
      })
    } // If not, check if the device sends any orientation data
    else if ('DeviceOrientationEvent' in window) {
      window.addEventListener("deviceorientation",(event: any) => {
        this.deviceOrientationHandler(event)
      });
    } // Send an alert if the device isn't compatible
    else {
      alert("Sorry, try again on a compatible mobile device!");
    }
  }

  deviceOrientationHandler(event: any) {
      //Check if absolute values have been sent
      if (typeof event.webkitCompassHeading !== "undefined") {
        this.currAzimuth = event.webkitCompassHeading; //iOS non-standard
      }
      else {
        this.currAzimuth = 360 - event.alpha
        this.isRelativeAzimuth = true
      }
  }
}
