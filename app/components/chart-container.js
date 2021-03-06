/**
 * Copyright 2020, Verizon Media.
 * Licensed under the Apache License, Version 2.0. See accompanying LICENSE file for terms.
 */
import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { task } from 'ember-concurrency';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { format, subDays } from 'date-fns';

const DATA_LOOKBACK = 90;

export default class ChartContainerComponent extends Component {
  @service elide;
  @tracked records;
  @tracked showModal;
  @tracked modalChart;

  charts = [
    {
      title: 'chartTitle.casesOverTime',
      component: 'time-series',
      metrics: {
        totalConfirmedCases: 'confirmed',
        totalDeaths: 'fatal',
        totalRecoveredCases: 'recovered',
      },
    },
    {
      title: 'chartTitle.movingAverage',
      component: 'time-series',
      metrics: {
        avgWeeklyConfirmedCases: 'confirmed',
        avgWeeklyDeaths: 'fatal',
      },
    },
    {
      title: 'chartTitle.dailyChange',
      component: 'stacked-bar',
      metrics: {
        numPositiveTests: 'confirmed',
        numDeaths: 'fatal',
        numRecoveredCases: 'recovered',
      },
    },
  ];

  get lookbackDate() {
    const lookbackDate = format(subDays(new Date(), DATA_LOOKBACK), 'yyyy-MM-dd');
    return `${lookbackDate}T00:00Z`;
  }

  @action
  fetchData() {
    const { location } = this.args;
    if (location) {
      this.records = undefined;
      this.fetchRecords.perform(location, this.lookbackDate);
    }
  }

  @(task(function* (location, lookbackDate) {
    const records = yield this.elide.fetch.linked().perform('healthRecords', {
      eq: { placeId: location.id },
      ge: { referenceDate: [lookbackDate] },
      fields: {
        healthRecords: [
          'referenceDate',
          'totalConfirmedCases',
          'totalDeaths',
          'totalRecoveredCases',
          'avgWeeklyConfirmedCases',
          'avgWeeklyDeaths',
          'numPositiveTests',
          'numDeaths',
          'numRecoveredCases',
        ],
      },
    });
    this.records = records;
  }).restartable())
  fetchRecords;

  @action
  showModalFor(chart) {
    this.showModal = true;
    this.modalChart = chart;
  }
}
