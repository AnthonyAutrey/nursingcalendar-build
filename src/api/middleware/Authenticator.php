<?php

// $RequireRole = function ($requiredRoles, $request, $response, $next) {
// 	$role = getRole();

// 	if (in_array($role, $requiredRoles))
// 		return $next($request, $response);

// 	return $response->withStatus(401);
// };

class Authenticator
{
    private $requiredRoles;

    public function __construct($requiredRoles)
    {
        $this->requiredRoles = $requiredRoles;
    }

    public function __invoke($request, $response, $next)
    {
		$role = $this->getRole();

		if (in_array($role, $this->requiredRoles))
			return $next($request, $response);

		return $response->withStatus(401);
	}
	
	private function getRole() {
		$role = null;

		if (isset($_SESSION) && isset($_SESSION['role']))
			$role = $_SESSION['role'];

		return $role;
	}
}