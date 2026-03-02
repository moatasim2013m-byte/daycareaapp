import React, { useMemo, useState } from 'react';
import { Plus, Search, ChevronDown, MoreVertical, X } from 'lucide-react';

const sideItems = [
  'Dashboard',
  'Demo Mode',
  'Center Management',
  'Program',
  'Attendance & Leaves',
  'Parent Communication',
  'Messages',
  'Billing & Accounting',
  'Tour Management',
  'Enquiries',
  'Calendar',
];

const feeSubMenu = ['Fee Plan', 'Discount', 'Tax Rate', 'Fee Component', 'Customize PDF', 'Upcoming Invoices'];

const feePlans = [
  { name: 'Annual Plan', status: 'Active', period: '01/12/2024', nextInvoice: '01/12/2025', students: 0 },
  { name: 'Monthly Plan For Daycare', status: 'Active', period: '01/12/2024 - 01/12/2025', nextInvoice: '01/06/2025', students: 0 },
];

const invoices = [
  { id: 'INV-2', status: 'Overdue', dueDate: '06/01/2025', pending: 500, total: 500 },
  { id: 'INV-1', status: 'Cancelled', dueDate: '06/01/2025', pending: 1000, total: 1000 },
];

const modalConfigs = {
  discount: {
    title: 'Create Discount',
    button: 'Add discount',
    fields: ['Name *', 'Type *', 'Discount Percentage *', 'Item Code *', 'Discount Type *'],
  },
  tax: {
    title: 'Create Tax Rate',
    button: 'Add tax rate',
    fields: ['Name *', 'Tax rate (%) *', 'Item Code *'],
  },
  feeComponent: {
    title: 'Create Fee Component',
    button: 'Add Fee Component',
    fields: ['Name *', 'Description *', 'Unit Price *', 'Category *', 'Item Code *'],
    extra: 'Refundable',
  },
};

const Field = ({ label }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-semibold text-slate-600">{label}</label>
    {label.includes('Description') ? (
      <textarea className="w-full rounded-lg border border-slate-200 p-3 text-sm" rows={4} placeholder="Please enter description" />
    ) : label === 'Type *' ? (
      <div className="flex items-center gap-4 py-1 text-slate-600">
        <label className="flex items-center gap-2"><input type="radio" defaultChecked name="type" /> Percentage</label>
        <label className="flex items-center gap-2"><input type="radio" name="type" /> Number</label>
      </div>
    ) : (
      <input className="w-full rounded-lg border border-slate-200 p-2.5 text-sm" placeholder="Please enter value" />
    )}
  </div>
);

const BillingAccountingDemo = () => {
  const [section, setSection] = useState('fee-plan');
  const [feeTab, setFeeTab] = useState('Fee Plan');
  const [openModal, setOpenModal] = useState(null);

  const topButtonText = useMemo(() => {
    if (feeTab === 'Discount') return modalConfigs.discount.button;
    if (feeTab === 'Tax Rate') return modalConfigs.tax.button;
    if (feeTab === 'Fee Component') return modalConfigs.feeComponent.button;
    return 'Fee Plan';
  }, [feeTab]);

  const showButton = feeTab !== 'Fee Plan';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <div className="flex">
        <aside className="h-screen w-64 border-r border-slate-200 bg-white p-4">
          <div className="mb-5 text-lg font-semibold">Kids Club</div>
          <ul className="space-y-2 text-sm">
            {sideItems.map((item) => (
              <li key={item} className={`rounded-lg px-3 py-2 ${item === 'Billing & Accounting' || item === 'Tour Management' ? 'bg-sky-700 text-white' : 'text-slate-600'}`}>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-2 text-sm text-slate-600">
            {feeSubMenu.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setFeeTab(item)}
                className={`block w-full rounded-lg px-3 py-2 text-left ${feeTab === item ? 'bg-sky-700 text-white' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Billing & Accounting</h1>
            <div className="flex gap-3">
              <button className={`rounded-lg px-4 py-2 ${section === 'fee-plan' ? 'bg-sky-700 text-white' : 'bg-white'}`} onClick={() => setSection('fee-plan')} type="button">Fee Plan</button>
              <button className={`rounded-lg px-4 py-2 ${section === 'student-balances' ? 'bg-sky-700 text-white' : 'bg-white'}`} onClick={() => setSection('student-balances')} type="button">Student Balances</button>
            </div>
          </div>

          {section === 'fee-plan' ? (
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold">{feeTab}</h2>
                {showButton && (
                  <button
                    type="button"
                    onClick={() => setOpenModal(feeTab === 'Discount' ? 'discount' : feeTab === 'Tax Rate' ? 'tax' : 'feeComponent')}
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-700 px-4 py-2 text-white"
                  >
                    <Plus size={16} /> {topButtonText}
                  </button>
                )}
              </div>

              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-400"><Search className="inline mr-2" size={16} />Search by name</div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-500">All <ChevronDown className="float-right" size={16} /></div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-500">All <ChevronDown className="float-right" size={16} /></div>
                <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-500">All <ChevronDown className="float-right" size={16} /></div>
              </div>

              <table className="w-full overflow-hidden rounded-xl border border-slate-200 text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Plan period</th>
                    <th className="p-3">Next invoice</th>
                    <th className="p-3">No of Students</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {feePlans.map((plan) => (
                    <tr key={plan.name} className="border-t border-slate-100">
                      <td className="p-3">{plan.name}</td>
                      <td className="p-3"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />{plan.status}</td>
                      <td className="p-3">{plan.period}</td>
                      <td className="p-3">{plan.nextInvoice}</td>
                      <td className="p-3">{plan.students}</td>
                      <td className="p-3 text-right"><MoreVertical size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="max-w-xl rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between rounded-t-xl bg-cyan-700 px-6 py-4 text-xl font-semibold text-white">
                  <span>Total Amount</span><span>INR 500</span>
                </div>
                <div className="space-y-2 p-4 text-lg">
                  <div className="flex justify-between"><span>1 Due invoices</span><span>INR 500</span></div>
                  <div className="flex justify-between"><span>0 Paid invoices</span><span>INR 0</span></div>
                  <div className="flex justify-between"><span>Invoice refund amount</span><span>INR 0</span></div>
                </div>
              </div>

              <table className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-3">Invoice ID</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Pending</th>
                    <th className="p-3">Total</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t border-slate-100">
                      <td className="p-3">{invoice.id}<div className="text-xs text-rose-500">{invoice.status}</div></td>
                      <td className="p-3">{invoice.dueDate}</td>
                      <td className="p-3">{invoice.pending}</td>
                      <td className="p-3">{invoice.total}</td>
                      <td className="p-3 text-right"><MoreVertical size={16} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </main>
      </div>

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h3 className="text-3xl font-semibold text-slate-700">{modalConfigs[openModal].title}</h3>
              <button type="button" onClick={() => setOpenModal(null)}><X className="text-slate-500" /></button>
            </div>
            <div className="space-y-4 p-5">
              {modalConfigs[openModal].fields.map((field) => <Field key={field} label={field} />)}
              {modalConfigs[openModal].extra && (
                <label className="flex items-center gap-2 text-lg text-slate-600"><input type="checkbox" /> {modalConfigs[openModal].extra}</label>
              )}
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 p-4">
              <button className="rounded-lg border border-slate-300 px-5 py-2 text-slate-500" type="button" onClick={() => setOpenModal(null)}>Cancel</button>
              <button className="rounded-lg bg-sky-700 px-5 py-2 text-white" type="button" onClick={() => setOpenModal(null)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingAccountingDemo;
