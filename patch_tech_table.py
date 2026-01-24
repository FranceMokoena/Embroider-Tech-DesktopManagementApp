from pathlib import Path
path = Path('src/pages/Technicians/TechniciansPage.jsx')
text = path.read_text(encoding='utf-8')
start = text.index('      <div className="technicians-list">')
end = text.index('      {isModalOpen && (', start)
new_block = """
      <div className=\"technicians-table-wrapper\">
        <table className=\"technicians-table\">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>No of Screens</th>
              <th>Date Joined</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechnicians.map((tech) => {
              const initials = tech.name
                .split(' ')
                .map((segment) => segment[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr key={tech.id}>
                  <td>
                    <div className=\"technician-table__name\">
                      <div className=\"technician-table__avatar\">{initials}</div>
                      <div>
                        <span className=\"technician-table__name-text\">{tech.name}</span>
                        <span className={`technician-table__status technician-table__status--${tech.status.toLowerCase()}`}>
                          {tech.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{tech.email}</td>
                  <td>{tech.department}</td>
                  <td>{tech.scans.toLocaleString()}</td>
                  <td>{new Date(tech.joined).toLocaleDateString()}</td>
                  <td className=\"technician-table__activity\">{tech.last}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
"""
path.write_text(text[:start] + new_block + text[end:], encoding='utf-8')
