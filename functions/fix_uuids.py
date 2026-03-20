import re

path = r"c:\Users\virgi\ClearHos\functions\app\routers\tareas.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = re.sub(r'==\s*tarea_id\b', '== str(tarea_id)', content)
content = re.sub(r'==\s*str\(str\(tarea_id\)\)', '== str(tarea_id)', content) # safety

content = re.sub(r'==\s*staff_id\b', '== str(staff_id)', content)
content = re.sub(r'==\s*str\(str\(staff_id\)\)', '== str(staff_id)', content) # safety

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

path2 = r"c:\Users\virgi\ClearHos\functions\app\routers\propiedades.py"
with open(path2, "r", encoding="utf-8") as f:
    c = f.read()
c = re.sub(r'==\s*propiedad_id\b', '== str(propiedad_id)', c)
c = re.sub(r'==\s*str\(str\(propiedad_id\)\)', '== str(propiedad_id)', c) 
with open(path2, "w", encoding="utf-8") as f: f.write(c)

path3 = r"c:\Users\virgi\ClearHos\functions\app\routers\reservas.py"
with open(path3, "r", encoding="utf-8") as f:
    c = f.read()
c = re.sub(r'==\s*reserva_id\b', '== str(reserva_id)', c)
c = re.sub(r'==\s*propiedad_id\b', '== str(propiedad_id)', c)
c = re.sub(r'==\s*str\(str\(reserva_id\)\)', '== str(reserva_id)', c)
c = re.sub(r'==\s*str\(str\(propiedad_id\)\)', '== str(propiedad_id)', c) 
with open(path3, "w", encoding="utf-8") as f: f.write(c)

path4 = r"c:\Users\virgi\ClearHos\functions\app\routers\staff.py"
with open(path4, "r", encoding="utf-8") as f:
    c = f.read()
c = re.sub(r'==\s*staff_id\b', '== str(staff_id)', c)
c = re.sub(r'==\s*str\(str\(staff_id\)\)', '== str(staff_id)', c)
with open(path4, "w", encoding="utf-8") as f: f.write(c)

print("Done")
