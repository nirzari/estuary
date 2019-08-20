import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { GreenwaveDecision } from '../../models/greenwave.type';


@Component({
  selector: 'app-tests-table',
  templateUrl: './tests-table.component.html',
})
export class TestsTableComponent implements OnChanges {

  @Input() greenwaveDecision: GreenwaveDecision;
  @Input() subjectIdentifier: string;
  formattedResults: Array<any>;
  title: string;
  titleLink: string;
  defaultColumns: Array<string>;
  defaultSortedColumn: string;
  uidColumn: string;
  linkColumnMappings: any;

  constructor() {
    this.defaultColumns = ['ID', 'Logs', 'Status', 'Test Case', 'Waived', 'Impacts the decision'];
    this.defaultSortedColumn = 'ID';
    this.uidColumn = 'ID';
  }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName of Object.keys(changes)) {
      if (propName === 'greenwaveDecision') {
        // Only call this if the greenwaveDecision object changes since this is an expensive
        // function call
        this.processDecision();
        break;
      }
    }
  }

  processDecision() {
    this.formattedResults = [];
    this.linkColumnMappings = {};
    this.title = `Test Results for ${this.subjectIdentifier}`;
    this.titleLink = null;
    if (!this.greenwaveDecision) {
      return;
    }
    if (this.greenwaveDecision.applicable_policies.filter(v => v.startsWith('osci')).length) {
      this.titleLink = `https://dashboard.osci.redhat.com/#/artifact/brew-build/nvr/${this.subjectIdentifier}?scratch=false`;
    }

    const waivedTestCases = this.greenwaveDecision.waivers
      .filter(waiver => waiver.waived)
      .map(waiver => waiver.testcase);

    const sortedResults = this.greenwaveDecision.results.slice().sort((a, b) => {
      return new Date(a.submit_time) > new Date(b.submit_time) ? -1 : (new Date(b.submit_time) > new Date(a.submit_time) ? 1 : 0);
    });
    const processedTestCases = [];
    for (const result of sortedResults) {
      /* showing only the last result */
      if (!processedTestCases.includes(result.testcase.name)) {
        const formattedResult = {
          'ID': result.id,
          'Item': result.data.item,
          'Status': result.outcome,
          'Test Case': result.testcase.name,
          'Logs': 'No logs available',
          'Waived': waivedTestCases.includes(result.testcase.name) ? 'Yes' : 'No',
          'Impacts the decision': this.greenwaveDecision.satisfied_requirements.map(
            function (j) { return j.result_id; }).includes(result.id) ? 'Yes' : 'No',
        };

        this.linkColumnMappings[result.id] = {
          'ID': result.href,
          'Test Case': result.testcase.href,
        };

        if (result.data.log) {
          formattedResult['Logs'] = 'Test Run Logs';
          this.linkColumnMappings[result.id]['Logs'] = result.ref_url;
        }

        this.formattedResults.push(formattedResult);
        processedTestCases.push(result.testcase.name);
      }

    }
  }
}
