import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, ViewChild, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Chart from 'chart.js/auto';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-sensor-dashboard',
  templateUrl: './sensor-dashboard.component.html',
  styleUrls: ['./sensor-dashboard.component.sass']
})
export class SensorDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('temperatureCanvas') temperatureCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('smokeCanvas') smokeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distanceCanvas') distanceCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lightCanvas') lightCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('smokeLevelPieCanvas') smokeLevelPieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('tempSmokeCompareCanvas') tempSmokeCompareCanvas!: ElementRef<HTMLCanvasElement>;

  temperatureChart!: Chart;
  smokeChart!: Chart;
  distanceChart!: Chart;
  lightChart!: Chart;
  smokeLevelPieChart!: Chart;
  tempSmokeCompareChart!: Chart;

    sensorData: any[] = [];
  isBrowser = false;
  chartsCreated = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private apiService: ApiService) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.apiService.getSensorData(20).subscribe(data => {
      this.sensorData = data.reverse();
      this.tryRenderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.tryRenderCharts();
  }

  tryRenderCharts() {
    if (this.isBrowser && this.sensorData.length && this.allCanvasReady() && !this.chartsCreated) {
      this.renderAllCharts();
      this.chartsCreated = true;
    }
  }

  allCanvasReady(): boolean {
    return !!(
      this.temperatureCanvas &&
      this.smokeCanvas &&
      this.distanceCanvas &&
      this.lightCanvas &&
      this.smokeLevelPieCanvas &&
      this.tempSmokeCompareCanvas
    );
  }

  renderAllCharts() {
    const labels = this.sensorData.map(d => new Date(d.timestamp).toLocaleTimeString());

    this.temperatureChart = new Chart(this.temperatureCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Temperature (°C)',
          data: this.sensorData.map(d => d.temperature),
          borderColor: '#3cba9f',
          backgroundColor: 'rgba(60, 186, 159, 0.2)',
          fill: true
        }]
      },
      options: this.getLineChartOptions('Time', 'Temperature')
    });

    this.smokeChart = new Chart(this.smokeCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Smoke (raw)',
          data: this.sensorData.map(d => d.smoke),
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true
        }]
      },
      options: this.getLineChartOptions('Time', 'Smoke')
    });

    this.distanceChart = new Chart(this.distanceCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Distance (cm)',
          data: this.sensorData.map(d => d.distance),
          borderColor: '#36a2eb',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true
        }]
      },
      options: this.getLineChartOptions('Time', 'Distance')
    });

    this.lightChart = new Chart(this.lightCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Light (raw)',
          data: this.sensorData.map(d => d.light),
          borderColor: '#ffce56',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          fill: true
        }]
      },
      options: this.getLineChartOptions('Time', 'Light')
    });

    type SmokeLevel = 'LOW' | 'MEDIUM' | 'HIGH';
    const smokeLevelsCount: Record<SmokeLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    this.sensorData.forEach(d => {
      const level = d.smoke_level as SmokeLevel;
      if (level in smokeLevelsCount) {
        smokeLevelsCount[level]++;
      }
    });

    this.smokeLevelPieChart = new Chart(this.smokeLevelPieCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: ['LOW', 'MEDIUM', 'HIGH'],
        datasets: [{
          data: [smokeLevelsCount.LOW, smokeLevelsCount.MEDIUM, smokeLevelsCount.HIGH],
          backgroundColor: ['#4caf50', '#ff9800', '#f44336']
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    });

    this.tempSmokeCompareChart = new Chart(this.tempSmokeCompareCanvas.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: this.sensorData.map(d => d.temperature),
            borderColor: '#3cba9f',
            backgroundColor: 'rgba(60, 186, 159, 0.2)',
            fill: true,
            yAxisID: 'y'
          },
          {
            label: 'Smoke (raw)',
            data: this.sensorData.map(d => d.smoke),
            borderColor: '#ff6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Temperature (°C)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Smoke (raw)' }
          },
          x: { title: { display: true, text: 'Time' } }
        }
      }
    });
  }

  getLineChartOptions(xLabel: string, yLabel: string) {
    return {
      responsive: true,
      scales: {
        x: { title: { display: true, text: xLabel } },
        y: { beginAtZero: true, title: { display: true, text: yLabel } }
      }
    };
  }
}
