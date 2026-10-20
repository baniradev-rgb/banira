/* Banira — shared sample dataset (FICTIONAL).
   One dataset drives the Lead Desk demo, the Workspace concept, the build-time static fallback and the tests.
   Raw inquiries are processed by the real engine (engine.js). The `sim` fields describe what happened next
   in this fictional story (a reply, a paused schedule, a failed send); they are simulation, not engine output.
   All times are UTC; the sample business is in America/New_York. */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.BANIRA_SAMPLES = factory();
})(this, function () {
  'use strict';
  return {
    note: 'Fictional sample data for Northfield Heating & Air, a business that does not exist.',
    now: '2026-10-20T18:16:00Z',            // Tue 20 Oct, 2:16 pm in the sample business's time zone
    selectable: ['furnace', 'heatpump', 'tuneup'],
    records: [
      {
        id: 'furnace', source: 'Website form', receivedAt: '2026-10-20T18:14:00Z',
        raw: { name: 'Sam Ortiz', email: 'sam.ortiz@example.com', phone: '(555) 010-2231', zip: '02139',
          message: 'Our furnace stopped last night and we have no heat. Two kids at home. Can someone come today? It was making a loud banging noise before it died.' },
        story: 'Arrives at 2:14 pm while Dana is on a job across town.',
        sim: {}
      },
      {
        id: 'heatpump', source: 'Website form', receivedAt: '2026-10-20T01:40:00Z',
        raw: { name: 'Lee Park', email: 'lee.park@example.com', phone: '', zip: '02446',
          message: 'Hi, we would like a quote to replace our 20-year-old AC with a heat pump before next summer. The house is about 1,800 sq ft and we are flexible on timing.' },
        story: 'Arrives at 9:40 pm on Monday, after the office has closed.',
        sim: {}
      },
      {
        id: 'tuneup', source: 'Website form', receivedAt: '2026-10-20T14:05:00Z',
        raw: { name: 'Priya Nair', email: 'priya.nair@example.com', phone: '(555) 010-6618', zip: '02420',
          message: 'Could we book a seasonal tune-up for our boiler sometime in November? Mornings are best for us.' },
        story: 'Arrives at 10:05 am during office hours.',
        sim: {}
      },
      {
        id: 'grinding', source: 'Website form', receivedAt: '2026-10-16T15:20:00Z',
        raw: { name: 'Marcus Bell', email: 'marcus.bell@example.com', phone: '(555) 010-7702', zip: '02138',
          message: 'Our heat pump is making a grinding noise when it starts up. Can someone take a look this week?' },
        sim: { status: 'replied', followupsSent: 1, lastReplyAt: '2026-10-19T12:12:00Z',
          note: 'Customer replied on Monday. The next hourly check marked it replied and stopped the remaining follow-ups.' }
      },
      {
        id: 'estimate', source: 'Website form', receivedAt: '2026-10-15T20:50:00Z',
        raw: { name: 'Jo Whitfield', email: 'jo.whitfield@example.com', phone: '', zip: '02421',
          message: 'We would like an estimate to replace our oil furnace with a heat pump system. Two-storey house, about 2,100 sq ft.' },
        sim: { status: 'booked', followupsSent: 2, pausedAt: '2026-10-19T14:30:00Z',
          note: 'Dana called Jo and set the status to booked. Follow-ups only run while a lead is new or following up, so follow-up 3 will not be sent.' }
      },
      {
        id: 'thermostat', source: 'Website form', receivedAt: '2026-10-20T11:52:00Z',
        raw: { name: 'Chris Dunn', email: 'chris.dunn@example.com', phone: '(555) 010-3390', zip: '02140',
          message: 'Our thermostat screen is blank and the heating is not working. Is this something you can fix?' },
        sim: { status: 'needs-attention', sendFailed: true,
          note: 'The acknowledgement could not be sent (simulated delivery failure). The inquiry is still recorded and Dana was alerted to call instead.' }
      },
      {
        id: 'spam', source: 'Website form', receivedAt: '2026-10-20T10:03:00Z',
        raw: { name: 'Mark', email: 'growth@seo-agency.example', phone: '', zip: '',
          message: 'We offer SEO services and backlinks to rank your website #1. See https://a.example https://b.example https://c.example' },
        sim: {}
      }
    ],
    // Workspace concept only (not part of Lead Desk today).
    workflows: [
      { id: 'replies', name: 'Inquiry replies', trigger: 'A website form is submitted', condition: 'Not spam, valid email, within sending limits', action: 'Send the approved reply for office hours, after hours or urgent', approval: 'Templates approved by the owner before go-live', state: 'active', availability: 'Lead Desk today' },
      { id: 'followups', name: 'Follow-ups', trigger: 'Hourly check', condition: 'Status is new or following up, no reply from the customer', action: 'Send the next follow-up on day 1, 3 or 7', approval: 'Templates approved by the owner', state: 'active', availability: 'Lead Desk today' },
      { id: 'digest', name: 'Daily summary', trigger: 'Every morning at 7:00', condition: 'Always', action: 'Email the owner new leads, replies and anything needing attention', approval: 'None needed (goes to the owner only)', state: 'active', availability: 'Lead Desk today' },
      { id: 'quotes', name: 'Quote follow-up', trigger: 'A quote is marked sent in the tracker', condition: 'No answer after 3 days', action: 'Send a short check-in about the quote', approval: 'Owner approves each message type', state: 'paused', availability: 'Planned module' },
      { id: 'reviews', name: 'Review requests', trigger: 'A job is marked complete', condition: 'Customer has not opted out', action: 'Ask every customer for a review (no filtering)', approval: 'Owner approves the wording', state: 'paused', availability: 'Planned module' }
    ]
  };
});
