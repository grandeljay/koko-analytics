'use strict'

import { h, Component } from 'preact'
import PropTypes from 'prop-types'
import Chart from './chart.js'
import Datepicker from './datepicker.js'
import Totals from './totals.js'
import TopPosts from './top-posts.js'
import TopReferrers from './top-referrers.js'
import Nav from './nav.js'
import datePresets from '../util/date-presets.js'
import { __ } from '@wordpress/i18n'
const settings = window.koko_analytics.settings
const pad = d => d < 10 ? '0' + d : d
const formatDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

function parseUrlParams (str) {
  const params = {}
  let match
  const matches = str.split('&')

  for (let i = 0; i < matches.length; i++) {
    match = matches[i].split('=')
    params[match[0]] = decodeURIComponent(match[1])
  }

  return params
}

export default class Dashboard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      ...this.setDatesFromDefaultView(),
      ...this.parseStateFromLocation(window.location.hash)
    }
    this.setDates = this.setDates.bind(this)
  }

  componentDidMount () {
    this.unlisten = this.props.history.listen((location, action) => {
      if (action === 'POP') {
        this.setState(this.parseStateFromLocation(location.search))
      }
    })
  }

  componentWillUnmount () {
    this.unlisten()
  }

  setDatesFromDefaultView () {
    const preset = datePresets.filter(p => p.key === settings.default_view).shift() || datePresets[0]
    return preset.dates()
  }

  parseStateFromLocation (str) {
    const searchPos = str.indexOf('?')
    if (searchPos === -1) {
      return {}
    }

    const queryStr = str.substring(searchPos + 1)
    const params = parseUrlParams(queryStr)
    if (!params.start_date || !params.end_date) {
      return {}
    }

    // parse url parameter into valid date (in local timezone)
    const parseDate = (str) => {
      const p = str.split('-')
        .map(i => parseInt(i))

      if (p.length !== 3) {
        return null
      }

      const year = p[0]
      const month = p[1] - 1
      const day = p[2]
      if (year < 2000 || year > 2100 || month < 0 || month > 11 || day < 0 || day > 31) {
        return null
      }

      return new Date(year, month, day)
    }
    const startDate = parseDate(params.start_date)
    const endDate = parseDate(params.end_date)
    if (!startDate || !endDate) {
      return {}
    }

    startDate.setHours(0, 0, 0)
    endDate.setHours(23, 59, 59)
    return { startDate, endDate }
  }

  setDates (startDate, endDate) {
    if (startDate.getTime() === this.state.startDate.getTime() && endDate.getTime() === this.state.endDate.getTime()) {
      return
    }

    // update state
    this.setState({ startDate, endDate })

    // update URL
    startDate = formatDate(startDate)
    endDate = formatDate(endDate)
    this.props.history.push(`/?start_date=${startDate}&end_date=${endDate}`)
  }

  render (props, state) {
    const { startDate, endDate } = state
    return (
      <main>
        <div>
          <div className='grid'>
            <div className='four'>
              <Datepicker startDate={startDate} endDate={endDate} onUpdate={this.setDates} />
            </div>
            <Nav />
          </div>
          <Totals startDate={startDate} endDate={endDate} />
          <Chart startDate={startDate} endDate={endDate} width={document.getElementById('koko-analytics-mount').clientWidth} />
          <div className='grid'>
            <TopPosts startDate={startDate} endDate={endDate} />
            <TopReferrers startDate={startDate} endDate={endDate} />
          </div>
          <div>
            <span className={'description right'}>{__('Tip: use the arrow keys to quickly cycle through date ranges.', 'koko-analytics')}</span>
          </div>
        </div>
      </main>
    )
  }
}

Dashboard.propTypes = {
  history: PropTypes.object.isRequired
}
