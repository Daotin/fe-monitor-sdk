import fetch from './fetch'
import observerEntries from './observerEntries'
import observerLCP from './observeLCP'
import observerFCP from './observerFCP'
import observerLoad from './observerLoad'
import observerFP from './observerFP'
import xhr from './xhr'

export default function performance() {
	fetch()
	observerEntries()
	observerLCP()
	observerFCP()
	observerLoad()
	observerFP()
	xhr()
}
